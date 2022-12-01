import { BigInt, log } from "@graphprotocol/graph-ts";

import { RewardPaid, Staked, Withdrawn } from "../generated/{{name}}/{{name}}";

import {
  User,
  StakedEvent,
  WithdrawnEvent,
  RewardPaidEvent,
} from "../generated/schema";

import { ENABLE_LOG } from "./Params";

const ADDRESS_ZERO = "0x0000000000000000000000000000000000000000";
const ADDRESS = "{{address}}".toLowerCase();

const ZERO = BigInt.fromI32(0);

// This function update user booster score for a Staked or Withdrawn event
const updateUser = (
  accountId: string,
  timestamp: BigInt,
  amount: BigInt,
  event: string,
  add: boolean
): void => {
  let user = User.load(accountId);
  if (user == null) {
    user = new User(accountId);
    user.contractAddress = ADDRESS;
    user.account = accountId;
    user.amount = ZERO;
    user.lastOperation = ZERO;
  }

  //const event = add ? "Staked" : "Withdrawn";

  if (ENABLE_LOG) {
    log.info(
      `Before ${event}(${timestamp}), ${accountId} amount is ${user.amount.toString()}`,
      []
    );
  }

  user.lastOperation = timestamp;
  if (add) {
    user.amount = user.amount.plus(amount);
  } else if (amount.ge(user.amount)) {
    user.amount = user.amount.minus(amount);
  }
  user.save();

  if (ENABLE_LOG) {
    log.info(
      `After ${event}(${timestamp}), ${accountId} amount is ${user.amount.toString()}`.toString(),
      []
    );
  }
};

export function handleStaked(event: Staked): void {
  let accountId = event.params.account.toHex().toLowerCase();
  let stakeAmount = event.params.stakeAmount;

  let transactionHash = event.transaction.hash.toHex().toLowerCase();
  // timestamp in millis
  let timestamp = event.block.timestamp.times(BigInt.fromU32(1000));

  let stakedEvent = StakedEvent.load(transactionHash);
  if (stakedEvent == null) {
    stakedEvent = new StakedEvent(transactionHash);
    stakedEvent.contractAddress = ADDRESS;
    stakedEvent.account = accountId;
    stakedEvent.stakeAmount = stakeAmount;
    stakedEvent.timestamp = timestamp;
    stakedEvent.save();
  }

  updateUser(accountId, timestamp, stakeAmount, "Staked", true);
}

export function handleWithdrawn(event: Withdrawn): void {
  let accountId = event.params.account.toHex().toLowerCase();
  let withdrawAmount = event.params.stakeAmount;

  let transactionHash = event.transaction.hash.toHex().toLowerCase();
  // timestamp in millis
  let timestamp = event.block.timestamp.times(BigInt.fromU32(1000));

  let withdrawnEvent = WithdrawnEvent.load(transactionHash);
  if (withdrawnEvent == null) {
    withdrawnEvent = new WithdrawnEvent(transactionHash);
    withdrawnEvent.contractAddress = ADDRESS;
    withdrawnEvent.account = accountId;
    withdrawnEvent.withdrawAmount = withdrawAmount;
    withdrawnEvent.timestamp = timestamp;
    withdrawnEvent.save();
  }

  updateUser(accountId, timestamp, withdrawAmount, "Withdrawn", false);
}

export function handleRewardPaid(event: RewardPaid): void {
  let accountId = event.params.account.toHex().toLowerCase();
  let rewardAmount = event.params.rewardAmount;

  let transactionHash = event.transaction.hash.toHex().toLowerCase();
  // timestamp in millis
  let timestamp = event.block.timestamp.times(BigInt.fromU32(1000));

  let rewardPaidEvent = RewardPaidEvent.load(transactionHash);
  if (rewardPaidEvent == null) {
    rewardPaidEvent = new RewardPaidEvent(transactionHash);
    rewardPaidEvent.contractAddress = ADDRESS;
    rewardPaidEvent.account = accountId;
    rewardPaidEvent.rewardAmount = rewardAmount;
    rewardPaidEvent.timestamp = timestamp;
    rewardPaidEvent.save();
  }

  updateUser(accountId, timestamp, rewardAmount, "RewardPaid", true);
}
