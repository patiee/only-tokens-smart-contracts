use cosmwasm_std::{
    coins, Addr, BankMsg, BlockInfo, Coin, CosmosMsg, DepsMut, Env, MessageInfo, Response,
    SubMsg, Timestamp, Uint128, WasmMsg,
};
use cw20::{Cw20Coin, Cw20ExecuteMsg, Cw20ReceiveMsg};
use cw_multi_test::{App, Bank, Contract, ContractWrapper, Executor};

use htcl_contract::contract::{execute, instantiate, query};
use htcl_contract::error::ContractError;
use htcl_contract::msg::{
    BalanceResponse, ConfigResponse, ContractInfoResponse, ExecuteMsg, InstantiateMsg, QueryMsg,
};

fn mock_app() -> App {
    App::default()
}

fn htcl_contract() -> Box<dyn Contract<cosmwasm_std::Empty>> {
    let contract = ContractWrapper::new(execute, instantiate, query);
    Box::new(contract)
}

fn mock_env(height: u64, time: u64) -> Env {
    Env {
        block: BlockInfo {
            height,
            time: Timestamp::from_seconds(time),
            chain_id: "test".to_string(),
        },
        contract: cosmwasm_std::ContractInfo {
            address: Addr::unchecked("contract"),
        },
        transaction: None,
    }
}

fn mock_info(sender: &str, funds: &[Coin]) -> MessageInfo {
    MessageInfo {
        sender: Addr::unchecked(sender),
        funds: funds.to_vec(),
    }
}

#[test]
fn test_instantiate() {
    let mut app = mock_app();
    let contract_id = app.store_code(htcl_contract());

    let alice = Addr::unchecked("alice");
    let bob = Addr::unchecked("bob");
    let timelock = 1000u64;
    let hashlock = "a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3";

    let msg = InstantiateMsg {
        bob: bob.to_string(),
        timelock,
        hashlock: hashlock.to_string(),
    };

    let info = mock_info("alice", &[]);
    let env = mock_env(1, 100);

    let res = instantiate(
        app.deps_mut(),
        env,
        info,
        msg,
    )
    .unwrap();

    assert_eq!(res.messages.len(), 0);
    assert_eq!(res.attributes[0].key, "method");
    assert_eq!(res.attributes[0].value, "instantiate");
}

#[test]
fn test_instantiate_invalid_timelock() {
    let mut app = mock_app();
    let contract_id = app.store_code(htcl_contract());

    let alice = Addr::unchecked("alice");
    let bob = Addr::unchecked("bob");
    let timelock = 50u64; // Past time
    let hashlock = "a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3";

    let msg = InstantiateMsg {
        bob: bob.to_string(),
        timelock,
        hashlock: hashlock.to_string(),
    };

    let info = mock_info("alice", &[]);
    let env = mock_env(1, 100); // Current time > timelock

    let res = instantiate(
        app.deps_mut(),
        env,
        info,
        msg,
    );

    assert!(res.is_err());
    assert_eq!(res.unwrap_err(), ContractError::InvalidTimelock {});
}

#[test]
fn test_instantiate_invalid_hashlock() {
    let mut app = mock_app();
    let contract_id = app.store_code(htcl_contract());

    let alice = Addr::unchecked("alice");
    let bob = Addr::unchecked("bob");
    let timelock = 1000u64;
    let hashlock = ""; // Empty hashlock

    let msg = InstantiateMsg {
        bob: bob.to_string(),
        timelock,
        hashlock: hashlock.to_string(),
    };

    let info = mock_info("alice", &[]);
    let env = mock_env(1, 100);

    let res = instantiate(
        app.deps_mut(),
        env,
        info,
        msg,
    );

    assert!(res.is_err());
    assert_eq!(res.unwrap_err(), ContractError::InvalidHashlock {});
}

#[test]
fn test_bob_withdraw_success() {
    let mut app = mock_app();
    let contract_id = app.store_code(htcl_contract());

    let alice = Addr::unchecked("alice");
    let bob = Addr::unchecked("bob");
    let timelock = 1000u64;
    let secret = "123";
    let mut hasher = sha2::Sha256::new();
    hasher.update(secret.as_bytes());
    let hashlock = format!("{:x}", hasher.finalize());

    // Instantiate contract
    let msg = InstantiateMsg {
        bob: bob.to_string(),
        timelock,
        hashlock: hashlock.clone(),
    };

    let info = mock_info("alice", &coins(100, "atom"));
    let env = mock_env(1, 100);

    let res = instantiate(
        app.deps_mut(),
        env,
        info,
        msg,
    )
    .unwrap();

    // Bob withdraws with correct secret
    let withdraw_msg = ExecuteMsg::BobWithdraw {
        secret: secret.to_string(),
    };

    let info = mock_info("bob", &[]);
    let env = mock_env(2, 200); // Before timelock

    let res = execute(
        app.deps_mut(),
        env,
        info,
        withdraw_msg,
    );

    assert!(res.is_ok());
    let res = res.unwrap();
    assert_eq!(res.messages.len(), 1); // Bank transfer message
}

#[test]
fn test_bob_withdraw_wrong_secret() {
    let mut app = mock_app();
    let contract_id = app.store_code(htcl_contract());

    let alice = Addr::unchecked("alice");
    let bob = Addr::unchecked("bob");
    let timelock = 1000u64;
    let secret = "123";
    let wrong_secret = "456";
    let mut hasher = sha2::Sha256::new();
    hasher.update(secret.as_bytes());
    let hashlock = format!("{:x}", hasher.finalize());

    // Instantiate contract
    let msg = InstantiateMsg {
        bob: bob.to_string(),
        timelock,
        hashlock: hashlock.clone(),
    };

    let info = mock_info("alice", &coins(100, "atom"));
    let env = mock_env(1, 100);

    let res = instantiate(
        app.deps_mut(),
        env,
        info,
        msg,
    )
    .unwrap();

    // Bob withdraws with wrong secret
    let withdraw_msg = ExecuteMsg::BobWithdraw {
        secret: wrong_secret.to_string(),
    };

    let info = mock_info("bob", &[]);
    let env = mock_env(2, 200); // Before timelock

    let res = execute(
        app.deps_mut(),
        env,
        info,
        withdraw_msg,
    );

    assert!(res.is_err());
    assert_eq!(res.unwrap_err(), ContractError::InvalidSecret {});
}

#[test]
fn test_bob_withdraw_after_timelock() {
    let mut app = mock_app();
    let contract_id = app.store_code(htcl_contract());

    let alice = Addr::unchecked("alice");
    let bob = Addr::unchecked("bob");
    let timelock = 1000u64;
    let secret = "123";
    let mut hasher = sha2::Sha256::new();
    hasher.update(secret.as_bytes());
    let hashlock = format!("{:x}", hasher.finalize());

    // Instantiate contract
    let msg = InstantiateMsg {
        bob: bob.to_string(),
        timelock,
        hashlock: hashlock.clone(),
    };

    let info = mock_info("alice", &coins(100, "atom"));
    let env = mock_env(1, 100);

    let res = instantiate(
        app.deps_mut(),
        env,
        info,
        msg,
    )
    .unwrap();

    // Bob withdraws after timelock
    let withdraw_msg = ExecuteMsg::BobWithdraw {
        secret: secret.to_string(),
    };

    let info = mock_info("bob", &[]);
    let env = mock_env(2, 1100); // After timelock

    let res = execute(
        app.deps_mut(),
        env,
        info,
        withdraw_msg,
    );

    assert!(res.is_err());
    assert_eq!(res.unwrap_err(), ContractError::TimelockExpired {});
}

#[test]
fn test_alice_withdraw_success() {
    let mut app = mock_app();
    let contract_id = app.store_code(htcl_contract());

    let alice = Addr::unchecked("alice");
    let bob = Addr::unchecked("bob");
    let timelock = 1000u64;
    let secret = "123";
    let mut hasher = sha2::Sha256::new();
    hasher.update(secret.as_bytes());
    let hashlock = format!("{:x}", hasher.finalize());

    // Instantiate contract
    let msg = InstantiateMsg {
        bob: bob.to_string(),
        timelock,
        hashlock: hashlock.clone(),
    };

    let info = mock_info("alice", &coins(100, "atom"));
    let env = mock_env(1, 100);

    let res = instantiate(
        app.deps_mut(),
        env,
        info,
        msg,
    )
    .unwrap();

    // Alice withdraws after timelock
    let withdraw_msg = ExecuteMsg::AliceWithdraw {};

    let info = mock_info("alice", &[]);
    let env = mock_env(2, 1100); // After timelock

    let res = execute(
        app.deps_mut(),
        env,
        info,
        withdraw_msg,
    );

    assert!(res.is_ok());
    let res = res.unwrap();
    assert_eq!(res.messages.len(), 1); // Bank transfer message
}

#[test]
fn test_alice_withdraw_before_timelock() {
    let mut app = mock_app();
    let contract_id = app.store_code(htcl_contract());

    let alice = Addr::unchecked("alice");
    let bob = Addr::unchecked("bob");
    let timelock = 1000u64;
    let secret = "123";
    let mut hasher = sha2::Sha256::new();
    hasher.update(secret.as_bytes());
    let hashlock = format!("{:x}", hasher.finalize());

    // Instantiate contract
    let msg = InstantiateMsg {
        bob: bob.to_string(),
        timelock,
        hashlock: hashlock.clone(),
    };

    let info = mock_info("alice", &coins(100, "atom"));
    let env = mock_env(1, 100);

    let res = instantiate(
        app.deps_mut(),
        env,
        info,
        msg,
    )
    .unwrap();

    // Alice withdraws before timelock
    let withdraw_msg = ExecuteMsg::AliceWithdraw {};

    let info = mock_info("alice", &[]);
    let env = mock_env(2, 200); // Before timelock

    let res = execute(
        app.deps_mut(),
        env,
        info,
        withdraw_msg,
    );

    assert!(res.is_err());
    assert_eq!(res.unwrap_err(), ContractError::TimelockNotExpired {});
}

#[test]
fn test_unauthorized_withdrawal() {
    let mut app = mock_app();
    let contract_id = app.store_code(htcl_contract());

    let alice = Addr::unchecked("alice");
    let bob = Addr::unchecked("bob");
    let charlie = Addr::unchecked("charlie");
    let timelock = 1000u64;
    let secret = "123";
    let mut hasher = sha2::Sha256::new();
    hasher.update(secret.as_bytes());
    let hashlock = format!("{:x}", hasher.finalize());

    // Instantiate contract
    let msg = InstantiateMsg {
        bob: bob.to_string(),
        timelock,
        hashlock: hashlock.clone(),
    };

    let info = mock_info("alice", &coins(100, "atom"));
    let env = mock_env(1, 100);

    let res = instantiate(
        app.deps_mut(),
        env,
        info,
        msg,
    )
    .unwrap();

    // Charlie tries to withdraw (unauthorized)
    let withdraw_msg = ExecuteMsg::BobWithdraw {
        secret: secret.to_string(),
    };

    let info = mock_info("charlie", &[]);
    let env = mock_env(2, 200); // Before timelock

    let res = execute(
        app.deps_mut(),
        env,
        info,
        withdraw_msg,
    );

    assert!(res.is_err());
    assert_eq!(res.unwrap_err(), ContractError::Unauthorized {});
}

#[test]
fn test_query_config() {
    let mut app = mock_app();
    let contract_id = app.store_code(htcl_contract());

    let alice = Addr::unchecked("alice");
    let bob = Addr::unchecked("bob");
    let timelock = 1000u64;
    let hashlock = "a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3";

    // Instantiate contract
    let msg = InstantiateMsg {
        bob: bob.to_string(),
        timelock,
        hashlock: hashlock.to_string(),
    };

    let info = mock_info("alice", &coins(100, "atom"));
    let env = mock_env(1, 100);

    let res = instantiate(
        app.deps_mut(),
        env,
        info,
        msg,
    )
    .unwrap();

    // Query config
    let query_msg = QueryMsg::GetConfig {};
    let res = query(app.deps(), mock_env(1, 100), query_msg);
    assert!(res.is_ok());

    let config: ConfigResponse = serde_json::from_slice(&res.unwrap()).unwrap();
    assert_eq!(config.alice, "alice");
    assert_eq!(config.bob, "bob");
    assert_eq!(config.timelock, 1000);
    assert_eq!(config.hashlock, hashlock);
}

#[test]
fn test_query_timelock_expired() {
    let mut app = mock_app();
    let contract_id = app.store_code(htcl_contract());

    let alice = Addr::unchecked("alice");
    let bob = Addr::unchecked("bob");
    let timelock = 1000u64;
    let hashlock = "a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3";

    // Instantiate contract
    let msg = InstantiateMsg {
        bob: bob.to_string(),
        timelock,
        hashlock: hashlock.to_string(),
    };

    let info = mock_info("alice", &coins(100, "atom"));
    let env = mock_env(1, 100);

    let res = instantiate(
        app.deps_mut(),
        env,
        info,
        msg,
    )
    .unwrap();

    // Query before timelock
    let query_msg = QueryMsg::IsTimelockExpired {};
    let res = query(app.deps(), mock_env(1, 200), query_msg);
    assert!(res.is_ok());
    let expired: bool = serde_json::from_slice(&res.unwrap()).unwrap();
    assert_eq!(expired, false);

    // Query after timelock
    let res = query(app.deps(), mock_env(1, 1100), query_msg);
    assert!(res.is_ok());
    let expired: bool = serde_json::from_slice(&res.unwrap()).unwrap();
    assert_eq!(expired, true);
}

#[test]
fn test_query_valid_secret() {
    let mut app = mock_app();
    let contract_id = app.store_code(htcl_contract());

    let alice = Addr::unchecked("alice");
    let bob = Addr::unchecked("bob");
    let timelock = 1000u64;
    let secret = "123";
    let mut hasher = sha2::Sha256::new();
    hasher.update(secret.as_bytes());
    let hashlock = format!("{:x}", hasher.finalize());

    // Instantiate contract
    let msg = InstantiateMsg {
        bob: bob.to_string(),
        timelock,
        hashlock: hashlock.clone(),
    };

    let info = mock_info("alice", &coins(100, "atom"));
    let env = mock_env(1, 100);

    let res = instantiate(
        app.deps_mut(),
        env,
        info,
        msg,
    )
    .unwrap();

    // Query with correct secret
    let query_msg = QueryMsg::IsValidSecret {
        secret: secret.to_string(),
    };
    let res = query(app.deps(), mock_env(1, 100), query_msg);
    assert!(res.is_ok());
    let valid: bool = serde_json::from_slice(&res.unwrap()).unwrap();
    assert_eq!(valid, true);

    // Query with wrong secret
    let query_msg = QueryMsg::IsValidSecret {
        secret: "wrong".to_string(),
    };
    let res = query(app.deps(), mock_env(1, 100), query_msg);
    assert!(res.is_ok());
    let valid: bool = serde_json::from_slice(&res.unwrap()).unwrap();
    assert_eq!(valid, false);
} 