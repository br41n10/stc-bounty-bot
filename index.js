/**
 * This is the main entrypoint to your Probot app
 * @param {import('probot').Probot} app
 */

const { providers, utils } = require('@starcoin/starcoin');
const commands = require("probot-commands");

const adminAddr = process.env.ADMIN_ADDR; // 0xabc
const adminPrivateKey = process.env.ADMIN_PRIVATE_KEY; // 0xdef
const nodeUrl = process.env.NODE_URL; // https

module.exports = (app) => {

  // init starcoin client
  let provider = new providers.JsonRpcProvider(nodeUrl);
  provider.getNetwork();

  app.log.info("Yay, the app was loaded!");

  /**
   * create new bounty task
   */
  commands(app, "bounty", async (context, command) => {
    if (context.payload.comment.user.type == "Bot") {
      return
    }

    // gate user
    if (!(context.payload.comment.author_association == "OWNER" ||
      context.payload.comment.author_association == "COLLABORATOR" ||
      context.payload.comment.author_association == "MEMBER")) {
        createComment(context, "Only OWNER/COLLABORATOR/MEMBER can create new bounty task.")
        return
    }

    // parse amount to integer.
    let amount = command.arguments.split(" ")[0]; // str
    if (amount.toLowerCase().endsWith("stc")) {
      try {
        amount = amount.slice(0, amount.length - 3) // remove `stc`
        amount = parseFloat(amount)
        amount = amount * 1000000000
        if (!Number.isInteger(amount)) {
          throw "invalid stc amount"
        }
      } catch (error) {
        createComment(context, 
          `Something error happens. bounty amount should like 1stc or 1000000000.`)
        return
      }
    } else {
      try {
        if (Number.isInteger(parseFloat(amount))) {
          throw "invalid amount, should be integer"
        }
        amount = parseInt(amount)
      } catch (error) {
        createComment(context, 
          `Something error happens. bounty amount should like 1stc or 1.5stc or 1000000000.`)
        return
      }
    }

    // params for generateRawUserTransaction
    const functionId = `${adminAddr}::Bounty::add_bounty`;
    const maxGasAmount = 10000000;
    const gasUnitPrice = 1;
    const senderSequenceNumber = await provider.getSequenceNumber(adminAddr);
    const nowSeconds = await provider.getNowSeconds();
    const network = await provider.getNetwork();
    const chainId = network.chainId;

    // payload
    // encodeScriptFunction()
    // encodeScriptFunctionArgs()
    let payload = await utils.tx.encodeScriptFunctionByResolve(
      functionId,
      [],
      [context.payload.issue.url, amount, context.payload.comment.user.login],
      nodeUrl,
    );

    const rawUserTransaction = utils.tx.generateRawUserTransaction(
      adminAddr,
      payload,
      maxGasAmount,
      gasUnitPrice,
      senderSequenceNumber,
      nowSeconds + 43200, // 12 hours
      chainId,
    );
    const signedUserTransaction = await utils.tx.signRawUserTransaction(
      adminPrivateKey,
      rawUserTransaction,
    );

    try {
      const txn = await provider.sendTransaction(signedUserTransaction);
      const txnInfo = await txn.wait(3);
      createComment(context,
        `Bounty task has been set. TxnHash ${txnInfo.transaction_hash}. Create comment to this issue to apply bounty like this\n\
         /apply 0x...`)
      return
    } catch (error) {
      // TODO: check abort_code
      createComment(context, "Something err happened.")
      context.log(error);
      return
    }
  });

  /**
   * apply as a hunter
   */
  commands(app, "apply", async (context, command) => {
    if (context.payload.comment.user.type == "Bot") {
      return
    }

    if (!command.arguments) {
      createComment(context, "Address must be provided.")
      return
    }

    let hunterAddr = command.arguments.split(" ")[0]; // str
    if (!hunterAddr.startsWith("0x")) {
      createComment(context, "Invalid address provided.")
      return
    }

    // params for generateRawUserTransaction
    const functionId = `${adminAddr}::Bounty::hunt`;
    const maxGasAmount = 10000000;
    const gasUnitPrice = 1;
    const senderSequenceNumber = await provider.getSequenceNumber(adminAddr);
    const nowSeconds = await provider.getNowSeconds();
    const network = await provider.getNetwork();
    const chainId = network.chainId;

    // payload
    // encodeScriptFunction()
    // encodeScriptFunctionArgs()
    let payload = await utils.tx.encodeScriptFunctionByResolve(
      functionId,
      [],
      [context.payload.issue.url, hunterAddr],
      nodeUrl,
    );

    const rawUserTransaction = utils.tx.generateRawUserTransaction(
      adminAddr,
      payload,
      maxGasAmount,
      gasUnitPrice,
      senderSequenceNumber,
      nowSeconds + 43200, // 12 hours
      chainId,
    );
    const signedUserTransaction = await utils.tx.signRawUserTransaction(
      adminPrivateKey,
      rawUserTransaction,
    );

    try {
      const txn = await provider.sendTransaction(signedUserTransaction);
      const txnInfo = await txn.wait(3);
      txnHash = txnInfo.transaction_hash;
      createComment(
        context,
        `@${context.payload.comment.user.login} applied this bounty task.\n\
        After you finished your work, @user who offerred you this bounty task. 
        He or her will check your work and send bounty.`,
      )
    } catch (error) {
      // TODO: check abort_code
      createComment(context, "Something err happened.")
      context.log(error);
    }
  });

  /**
   * send bounty award
   */
   commands(app, "send", async (context, command) => {
    if (context.payload.comment.user.type == "Bot") {
      return
    }

    // gate user
    if (!(context.payload.comment.author_association == "OWNER" ||
      context.payload.comment.author_association == "COLLABORATOR" ||
      context.payload.comment.author_association == "MEMBER")) {
        createComment(context, "Only OWNER/COLLABORATOR/MEMBER can send bounty.")
        return
    }

    // read "percentage%", percentage is a positive integer.
    let percentageStr = command.arguments.split(" ")[0]; // str
    if ((!percentageStr.endsWith("%")) || percentageStr.startsWith("0")) {
      createComment(context, "Invalid percentage provided. Should like 100% or 50% or 150%.")
      return
    }
    const percentage = parseInt(percentageStr.slice(0, percentageStr.length - 1))
    context.log(percentage)

    // params for generateRawUserTransaction
    const functionId = `${adminAddr}::Bounty::send`;
    const maxGasAmount = 10000000;
    const gasUnitPrice = 1;
    const senderSequenceNumber = await provider.getSequenceNumber(adminAddr);
    const nowSeconds = await provider.getNowSeconds();
    const network = await provider.getNetwork();
    const chainId = network.chainId;

    // payload
    // encodeScriptFunction()
    // encodeScriptFunctionArgs()
    let payload = await utils.tx.encodeScriptFunctionByResolve(
      functionId,
      [],
      [context.payload.issue.url, percentage],
      nodeUrl,
    );

    const rawUserTransaction = utils.tx.generateRawUserTransaction(
      adminAddr,
      payload,
      maxGasAmount,
      gasUnitPrice,
      senderSequenceNumber,
      nowSeconds + 43200, // 12 hours
      chainId,
    );
    const signedUserTransaction = await utils.tx.signRawUserTransaction(
      adminPrivateKey,
      rawUserTransaction,
    );

    try {
      const txn = await provider.sendTransaction(signedUserTransaction);
      const txnInfo = await txn.wait(3);
      txnHash = txnInfo.transaction_hash;
      createComment(
        context,
        `Bounty has send to @${context.payload.comment.user.login}. TxnHash: ${txnHash}`,
      )
    } catch (error) {
      // TODO: check abort_code
      createComment(context, "Something err happened.")
      context.log(error);
    }
  });

  // create new comment to issue.
  function createComment(context, body) {
    const issueComment = context.issue({
      body: body,
    });
    context.octokit.issues.createComment(issueComment);
  }
};
