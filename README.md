# Medivance (Backend)

An API Endpoint for Medivance Application.

## How it works?

We are using `express.js` ans `firebase-admin` to make an API using RESTful JSON.

## How to run?

### 1. Clone this repository

```bash
git clone https://github.com/APAC-Medivance/medivance-backend.git
```

### 2. Get the Service Account Key

- Go to your Firebase app
- Then, go to `Project Settings`
- And then, go to `Service Accounts`
- In `Service Accounts`, Generate your new private key
  > [!NOTE]
  > Make sure you are in "Firebase Admin SDK".

- After that, the file will automatically downloaded as JSON file.
  > [!IMPORTANT]
  > After downloading JSON Files, rename the file to `serviceAccountKey.json`.

- Copy the JSON file into `config` folder
  > [!NOTE]
  > If it's empty or not define, just create the `config` folder


### 3. Setup the environment
> [!NOTE]
> You must put database URL in `URL`.

Take a look at this code on `.env.example` : 
```bash
URL= # This is your database URL
PORT= # This is port of your apps, Default is 3000
```

### 4. Run the app

```bash
npm start
```