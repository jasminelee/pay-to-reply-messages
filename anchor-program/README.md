
# Squeaky Wheel Anchor Program

This Anchor program enables sending SOL payments on the Sonic DevNet. It's designed to be integrated with a messaging system where users can pay to send messages.

## Features

- Send SOL from one wallet to another using Solana programs
- Integration with Sonic DevNet for better performance
- Simple client application to test the functionality

## Prerequisites

Before you begin, make sure you have the following installed:

- [Rust](https://www.rust-lang.org/tools/install)
- [Solana CLI](https://docs.solana.com/cli/install-solana-cli-tools)
- [Anchor](https://www.anchor-lang.com/docs/installation)
- [Node.js](https://nodejs.org/) (v14 or higher)
- [Yarn](https://yarnpkg.com/getting-started/install) or [npm](https://www.npmjs.com/get-npm)

## Setup

1. Clone the repository:
   ```
   git clone <repository-url>
   cd anchor-program
   ```

2. Install dependencies:
   ```
   yarn install
   ```

3. Configure your Solana CLI to use Sonic DevNet:
   ```
   solana config set --url https://api.testnet.sonic.game
   ```

4. Create a new keypair (if you don't have one):
   ```
   solana-keygen new
   ```

5. Request SOL from the Sonic DevNet faucet:
   ```
   # Visit https://faucet.sonic.game and request SOL for your public key
   ```

## Building and Deploying

1. Build the program:
   ```
   anchor build
   ```

2. Get the program ID:
   ```
   solana address -k target/deploy/pay_to_reply-keypair.json
   ```

3. Update the program ID in `Anchor.toml` and `lib.rs` with the address from the previous step.

4. Deploy the program:
   ```
   anchor deploy
   ```

## Using the Program

### Running the Client

The client application lets you send SOL to another account:

```
# Send 0.01 SOL to a recipient
yarn start <RECIPIENT_ADDRESS> 0.01

# OR using npm
npm run start <RECIPIENT_ADDRESS> 0.01
```

If you don't specify a recipient address or amount, it will use the default values.

### Running Tests

Run the tests to verify that the program is working correctly:

```
anchor test
```

## Integration

To integrate this program with your messaging app:

1. When a user sends a message, initiate a transaction using the program
2. Include the recipient's wallet address and the amount of SOL to send
3. Use the IDL file from `target/idl/pay_to_reply.json` to interact with the program

## License

This project is licensed under the MIT License. See the LICENSE file for details. 
