# stc-bounty-bot

A bot for offerring bounty with STC in Github.

> A GitHub App built with [Probot](https://github.com/probot/probot). 

## Config

Edit .env file, or just set the environment variable.

Follow instruction on [Probot Doc](https://probot.github.io/docs/configuration/) to setup the following item.
* WEBHOOK_PROXY_URL
* APP_ID
* PRIVATE_KEY
* WEBHOOK_SECRET
* GITHUB_CLIENT_ID
* GITHUB_CLIENT_SECRET

And you should set some environment variables used by this app.
* ADMIN_ADDR: special account that holds contract code.
* ADMIN_PRIVATE_KEY: private key of the admin addr.
* NODE_URL: websocket url of node. for example https://barnard-seed.starcoin.org.


## Setup

```sh
# Install dependencies
npm install

# Run the bot
npm start
```

## Usage And Reference

This app listen to and `issue_comment` event with the installed Github repo. When a new issue comment posted, the app read the comment content and check if it is a `command`.

There are three command available.

### bounty

Create a new bounty task to an issue.

> /bounty 1STC

or the same

> /bounty 1000000000

`bounty` command will create new bounty task offerring amount of STC.

`bounty` command can only called by "admin user" who is the `OWNER`, `COLLABORATOR` or `MEMBER` of the repo.

After this, people can apply this bounty task.

### apply

Apply a bounty task as a "bounty hunter", with your address.

> /apply 0xABC

`apply` command will set you as a hunter to this bounty task.


### send

After hunter finished work, and admin checks for it. Admin can "send" amount of bounty money to hunter. Depends on the working quality, Admin can send percentage of the bounty money.

> /send 80%


## Contributing

If you have suggestions for how stc-bounty-bot could be improved, or want to report a bug, open an issue! We'd love all and any contributions.

For more, check out the [Contributing Guide](CONTRIBUTING.md).

## License

[ISC](LICENSE) © 2022 br41n10
