import { BigInt, log } from "@graphprotocol/graph-ts";

import { Transfer } from "../generated/{{name}}/{{name}}";
import { ERC20Transaction, User } from "../generated/schema";

const ZERO = BigInt.fromI32(0);

export function handleTransfer(event: Transfer): void {
  let sender = event.params.from.toHex();
  let receiver = event.params.to.toHex();

  let transactionHash = event.transaction.hash.toHex();
  let amount = event.params.value;
  let timestamp = event.block.timestamp;

  let erc20Transaction = ERC20Transaction.load(transactionHash);
  if (erc20Transaction == null) {
    erc20Transaction = new ERC20Transaction(transactionHash);
    erc20Transaction.from = sender;
    erc20Transaction.to = receiver;
    erc20Transaction.amount = amount;
    erc20Transaction.timestamp = timestamp;
    erc20Transaction.save();
  }

  let user = User.load(receiver);
  if (user == null) {
    user = new User(receiver);
    user.amount = ZERO;
    user.lastOperation = ZERO;
  }
  user.amount.plus(amount);
  user.lastOperation = timestamp;
  user.save();
}
