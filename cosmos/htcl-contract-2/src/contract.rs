use cosmwasm_std::{
    entry_point, to_binary, Binary, Deps, DepsMut, Env, MessageInfo, Response, StdResult, SubMsg,
    Uint128, WasmMsg,
};
use cw20::{Cw20ExecuteMsg, Cw20ReceiveMsg};
use sha2::{Digest, Sha256};

use crate::error::ContractError;
use crate::msg::{
    AliceWithdrawnEvent, BobWithdrawnEvent, Cw20Withdrawal, ExecuteMsg, InstantiateMsg, QueryMsg,
};
use crate::state::{Config, CONFIG, CW20_BALANCES};

#[entry_point]
pub fn instantiate(
    deps: DepsMut,
    _env: Env,
    info: MessageInfo,
    msg: InstantiateMsg,
) -> Result<Response, ContractError> {
    // Validate bob address
    let bob = deps.api.addr_validate(&msg.bob)?;
    if bob == info.sender {
        return Err(ContractError::InvalidRecipientAddress {});
    }

    // Validate timelock (must be in the future)
    if msg.timelock <= _env.block.time.seconds() {
        return Err(ContractError::InvalidTimelock {});
    }

    // Validate hashlock (must not be empty)
    if msg.hashlock.is_empty() {
        return Err(ContractError::InvalidHashlock {});
    }

    let config = Config {
        alice: info.sender.clone(),
        bob,
        timelock: msg.timelock,
        hashlock: msg.hashlock,
    };

    CONFIG.save(deps.storage, &config)?;

    // Emit event
    let event = crate::state::HTCLCreatedEvent {
        alice: info.sender.to_string(),
        bob: config.bob.to_string(),
        timelock: config.timelock,
        hashlock: config.hashlock.clone(),
    };

    Ok(Response::new()
        .add_attribute("method", "instantiate")
        .add_attribute("alice", info.sender)
        .add_attribute("bob", config.bob)
        .add_attribute("timelock", config.timelock.to_string())
        .add_attribute("hashlock", config.hashlock)
        .set_data(to_binary(&event)?))
}

#[entry_point]
pub fn execute(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    msg: ExecuteMsg,
) -> Result<Response, ContractError> {
    match msg {
        ExecuteMsg::BobWithdraw { secret } => execute_bob_withdraw(deps, env, info, secret),
        ExecuteMsg::AliceWithdraw {} => execute_alice_withdraw(deps, env, info),
        ExecuteMsg::Receive(msg) => execute_receive_cw20(deps, env, info, msg),
    }
}

pub fn execute_bob_withdraw(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    secret: String,
) -> Result<Response, ContractError> {
    let config = CONFIG.load(deps.storage)?;

    // Check if caller is Bob
    if info.sender != config.bob {
        return Err(ContractError::Unauthorized {});
    }

    // Check if timelock has expired
    if env.block.time.seconds() >= config.timelock {
        return Err(ContractError::TimelockExpired {});
    }

    // Validate secret
    let mut hasher = Sha256::new();
    hasher.update(secret.as_bytes());
    let secret_hash = format!("{:x}", hasher.finalize());

    if secret_hash != config.hashlock {
        return Err(ContractError::InvalidSecret {});
    }

    // Get native balance
    let native_balance = env.contract_address.clone();
    let native_coins = deps.querier.query_all_balances(&native_balance)?;

    // Get cw20 balances
    let mut cw20_withdrawals = Vec::new();
    let mut cw20_messages = Vec::new();

    for (token_addr, amount) in
        CW20_BALANCES.range(deps.storage, None, None, cosmwasm_std::Order::Ascending)
    {
        if amount > Uint128::zero() {
            cw20_withdrawals.push(Cw20Withdrawal {
                token: token_addr.to_string(),
                amount,
            });

            // Create transfer message
            let transfer_msg = Cw20ExecuteMsg::Transfer {
                recipient: config.bob.to_string(),
                amount,
            };

            let wasm_msg = WasmMsg::Execute {
                contract_addr: token_addr.to_string(),
                msg: to_binary(&transfer_msg)?,
                funds: vec![],
            };

            cw20_messages.push(SubMsg::new(wasm_msg));
        }
    }

    // Clear cw20 balances
    for (token_addr, _) in
        CW20_BALANCES.range(deps.storage, None, None, cosmwasm_std::Order::Ascending)
    {
        CW20_BALANCES.remove(deps.storage, &token_addr);
    }

    // Create native transfer message
    let mut messages = cw20_messages;
    if !native_coins.is_empty() {
        messages.push(SubMsg::new(cosmwasm_std::BankMsg::Send {
            to_address: config.bob.to_string(),
            amount: native_coins.clone(),
        }));
    }

    // Emit event
    let event = BobWithdrawnEvent {
        bob: config.bob.to_string(),
        secret,
        native_amount: native_coins,
        cw20_amount: cw20_withdrawals,
    };

    Ok(Response::new()
        .add_submessages(messages)
        .add_attribute("method", "bob_withdraw")
        .add_attribute("bob", config.bob)
        .set_data(to_binary(&event)?))
}

pub fn execute_alice_withdraw(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
) -> Result<Response, ContractError> {
    let config = CONFIG.load(deps.storage)?;

    // Check if caller is Alice
    if info.sender != config.alice {
        return Err(ContractError::Unauthorized {});
    }

    // Check if timelock has expired
    if env.block.time.seconds() < config.timelock {
        return Err(ContractError::TimelockNotExpired {});
    }

    // Get native balance
    let native_balance = env.contract_address.clone();
    let native_coins = deps.querier.query_all_balances(&native_balance)?;

    // Get cw20 balances
    let mut cw20_withdrawals = Vec::new();
    let mut cw20_messages = Vec::new();

    for (token_addr, amount) in
        CW20_BALANCES.range(deps.storage, None, None, cosmwasm_std::Order::Ascending)
    {
        if amount > Uint128::zero() {
            cw20_withdrawals.push(Cw20Withdrawal {
                token: token_addr.to_string(),
                amount,
            });

            // Create transfer message
            let transfer_msg = Cw20ExecuteMsg::Transfer {
                recipient: config.alice.to_string(),
                amount,
            };

            let wasm_msg = WasmMsg::Execute {
                contract_addr: token_addr.to_string(),
                msg: to_binary(&transfer_msg)?,
                funds: vec![],
            };

            cw20_messages.push(SubMsg::new(wasm_msg));
        }
    }

    // Clear cw20 balances
    for (token_addr, _) in
        CW20_BALANCES.range(deps.storage, None, None, cosmwasm_std::Order::Ascending)
    {
        CW20_BALANCES.remove(deps.storage, &token_addr);
    }

    // Create native transfer message
    let mut messages = cw20_messages;
    if !native_coins.is_empty() {
        messages.push(SubMsg::new(cosmwasm_std::BankMsg::Send {
            to_address: config.alice.to_string(),
            amount: native_coins.clone(),
        }));
    }

    // Emit event
    let event = AliceWithdrawnEvent {
        alice: config.alice.to_string(),
        native_amount: native_coins,
        cw20_amount: cw20_withdrawals,
    };

    Ok(Response::new()
        .add_submessages(messages)
        .add_attribute("method", "alice_withdraw")
        .add_attribute("alice", config.alice)
        .set_data(to_binary(&event)?))
}

pub fn execute_receive_cw20(
    deps: DepsMut,
    _env: Env,
    info: MessageInfo,
    cw20_msg: Cw20ReceiveMsg,
) -> Result<Response, ContractError> {
    // Store the cw20 tokens
    let token_addr = info.sender;
    let amount = cw20_msg.amount;

    let current_balance = CW20_BALANCES
        .load(deps.storage, &token_addr)
        .unwrap_or(Uint128::zero());
    CW20_BALANCES.save(deps.storage, &token_addr, &(current_balance + amount))?;

    Ok(Response::new()
        .add_attribute("method", "receive_cw20")
        .add_attribute("token", token_addr)
        .add_attribute("amount", amount))
}

#[entry_point]
pub fn query(deps: Deps, _env: Env, msg: QueryMsg) -> StdResult<Binary> {
    match msg {
        QueryMsg::GetConfig {} => to_binary(&query_config(deps)?),
        QueryMsg::GetBalance {} => to_binary(&query_balance(deps)?),
        QueryMsg::IsTimelockExpired {} => to_binary(&query_timelock_expired(deps, _env)?),
        QueryMsg::IsValidSecret { secret } => to_binary(&query_valid_secret(deps, secret)?),
        QueryMsg::GetContractInfo {} => to_binary(&query_contract_info(deps, _env)?),
    }
}

fn query_config(deps: Deps) -> StdResult<crate::msg::ConfigResponse> {
    let config = CONFIG.load(deps.storage)?;
    Ok(crate::msg::ConfigResponse {
        alice: config.alice.to_string(),
        bob: config.bob.to_string(),
        timelock: config.timelock,
        hashlock: config.hashlock,
    })
}

fn query_balance(deps: Deps) -> StdResult<crate::msg::BalanceResponse> {
    let mut cw20_balances = Vec::new();

    for (token_addr, amount) in
        CW20_BALANCES.range(deps.storage, None, None, cosmwasm_std::Order::Ascending)
    {
        if amount > Uint128::zero() {
            cw20_balances.push(crate::msg::Cw20Balance {
                address: token_addr.to_string(),
                amount,
            });
        }
    }

    Ok(crate::msg::BalanceResponse {
        native: vec![], // Will be filled by caller
        cw20: cw20_balances,
    })
}

fn query_timelock_expired(deps: Deps, env: cosmwasm_std::Env) -> StdResult<bool> {
    let config = CONFIG.load(deps.storage)?;
    Ok(env.block.time.seconds() >= config.timelock)
}

fn query_valid_secret(deps: Deps, secret: String) -> StdResult<bool> {
    let config = CONFIG.load(deps.storage)?;

    let mut hasher = Sha256::new();
    hasher.update(secret.as_bytes());
    let secret_hash = format!("{:x}", hasher.finalize());

    Ok(secret_hash == config.hashlock)
}

fn query_contract_info(
    deps: Deps,
    env: cosmwasm_std::Env,
) -> StdResult<crate::msg::ContractInfoResponse> {
    let config = CONFIG.load(deps.storage)?;

    // Get native balance
    let native_balance = env.contract_address;
    let native_coins = deps.querier.query_all_balances(&native_balance)?;

    // Get cw20 balances
    let mut cw20_balances = Vec::new();
    for (token_addr, amount) in
        CW20_BALANCES.range(deps.storage, None, None, cosmwasm_std::Order::Ascending)
    {
        if amount > Uint128::zero() {
            cw20_balances.push(crate::msg::Cw20Balance {
                address: token_addr.to_string(),
                amount,
            });
        }
    }

    Ok(crate::msg::ContractInfoResponse {
        alice: config.alice.to_string(),
        bob: config.bob.to_string(),
        timelock: config.timelock,
        hashlock: config.hashlock,
        native_balance: native_coins,
        cw20_balances,
    })
}
