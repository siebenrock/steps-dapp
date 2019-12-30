import Web3 from "web3";
import Compete from "../build/contracts/Compete.json";

let web3;
let compete;
let globalContractAddress;
let globalUserAccount;
let globalUserBalance;

const initWeb3 = () => {
  return new Promise((resolve, reject) => {
    if (typeof window.ethereum !== "undefined") {
      const web3 = new Web3(window.ethereum);
      window.ethereum
        .enable()
        .then(() => {
          resolve(new Web3(window.ethereum));
        })
        .catch((e) => {
          reject(e);
        });
      return;
    }
    if (typeof window.web3 !== "undefined") {
      return resolve(new Web3(window.web3.currentProvider));
    }
    resolve(new Web3("http://localhost:9545"));
  });
};

const initContract = () => {
  const deploymentKey = Object.keys(Compete.networks)[0];
  return new web3.eth.Contract(
    Compete.abi,
    Compete.networks[deploymentKey].address,
  );
};

const initNavigation = () => {
  const $navOverview = document.getElementById("nav-overview");
  const $navNew = document.getElementById("nav-new");

  $navOverview.addEventListener("click", () => {
    document.getElementById("container-overview").style.display = "block";
    document.getElementById("container-new").style.display = "none";
  });

  $navNew.addEventListener("click", () => {
    document.getElementById("container-overview").style.display = "none";
    document.getElementById("container-new").style.display = "block";
  });
};

const initApp = () => {
  const $create = document.getElementById("create");
  const $createSpinner = document.getElementById("participate-spinner");
  const $createResult = document.getElementById("create-result");
  const $pay = document.getElementById("pay");
  const $paySpinner = document.getElementById("pay-spinner");
  const $payResult = document.getElementById("pay-result");
  const $payHash = document.getElementById("transaction-hash-info");
  const $read = document.getElementById("read");
  const $readResult = document.getElementById("read-result");
  const $readResultTable = document.getElementById("read-result-table");
  const $readSpinner = document.getElementById("read-spinner");
  const $edit = document.getElementById("edit");
  const $editResult = document.getElementById("edit-result");
  const $editSpinner = document.getElementById("edit-spinner");
  const $withdraw = document.getElementById("withdraw");
  const $withdrawResult = document.getElementById("withdraw-result");
  const $withdrawSpinner = document.getElementById("withdraw-spinner");
  let accounts = [];

  const contractAddress = Compete.networks["3"].address;
  globalContractAddress = contractAddress;

  const $contractInfo = document.getElementById("contract-address-info");
  const $newContractInfo = document.getElementById("new-contract-address-info");
  $contractInfo.href = $newContractInfo.href = `https://ropsten.etherscan.io/address/${contractAddress}`;
  $contractInfo.innerHTML = $newContractInfo.innerHTML = `Contract: ${contractAddress}`;

  console.log("Version", Web3.version);
  console.log("Contract", contractAddress);

  web3.eth.getAccounts().then((_accounts) => {
    accounts = _accounts;
    web3.eth.defaultAccount = _accounts[0];
    globalUserAccount = _accounts[0];
    document.getElementById("participate-address").value = _accounts[0];
    document.getElementById("read-id").value = _accounts[0];

    const $addressInfo = document.getElementById("address-info");

    $addressInfo.href = `https://ropsten.etherscan.io/address/${_accounts[0]}`;
    $addressInfo.innerHTML = `Address: ${_accounts[0]}`;
    console.log("Address", _accounts[0]);

    updateContractBalance();
    updateUserBalance();
  });

  $create.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = e.target.elements[0].value;
    const stepsCurrent = e.target.elements[2].value;
    const stepsGoal = e.target.elements[3].value;
    $createSpinner.classList.remove("d-none");
    compete.methods
      .participate(name, stepsCurrent, stepsGoal)
      .send({ from: accounts[0] })
      .then((result) => {
        console.log("Result", result);

        $createResult.classList.remove("d-none");
        $createResult.classList.remove("alert-danger");
        $createResult.innerHTML = `Success, ${name} participates`;
        $createSpinner.classList.add("d-none");
      })
      .catch((_e) => {
        console.log("Error", _e);
        $createResult.classList.remove("d-none");
        $createResult.classList.add("alert-danger");
        $createResult.innerHTML = `Error while trying to participate ${
          _e.message
        }`;
        $createSpinner.classList.add("d-none");
      });
  });

  $pay.addEventListener("submit", (e) => {
    e.preventDefault();
    const stake = e.target.elements[0].value;
    $paySpinner.classList.remove("d-none");
    console.log("Stake", stake);
    compete.methods
      .pay()
      .send({
        from: accounts[0],
        value: web3.utils.toWei(stake, "ether"),
        contractAddress: Compete.networks["3"].address,
        to: Compete.networks["3"].address,
        gas: 200000,
        gasLimit: 500000,
        gasPriceInWei: 1000,
      })
      .then((result) => {
        console.log("transactionHash", result);
        $payResult.classList.remove("d-none");
        $payResult.classList.remove("alert-danger");
        $payResult.innerHTML = `Success, transaction in block ${
          result.blockNumber
        }`;

        $payHash.classList.remove("d-none");
        $payHash.href = `https://ropsten.etherscan.io/tx/${
          result.transactionHash
        }`;
        $payHash.innerHTML = `Transaction: ${result.transactionHash.slice(
          0,
          40,
        )}...`;

        $paySpinner.classList.add("d-none");
        console.log("Transaction", result);

        updateContractBalance();
        updateUserBalance();
      })
      .catch((_e) => {
        $payResult.classList.remove("d-none");
        $payResult.classList.add("alert-danger");
        $payResult.innerHTML = `Transaction: ${_e.message}`;

        $paySpinner.classList.add("d-none");
        console.log("Error", _e);
      });
  });

  $read.addEventListener("submit", (e) => {
    e.preventDefault();
    const address = e.target.elements[0].value;
    $readSpinner.classList.remove("d-none");
    compete.methods
      .info(address)
      .call()
      .then((result) => {
        console.log("Result", result);
        $readResult.classList.add("d-none");
        $readResultTable.classList.remove("d-none");
        $readResultTable.innerHTML = `<li class="list-group-item"><b>Address:</b> ${
          result[4]
        }</li>
        <li class="list-group-item"><b>Name:</b> ${result[1]} <b>ID:</b> ${
          result[0]
        }</li>
        <li class="list-group-item"><b>Steps:</b> ${result[2]} <b>Goal:</b> ${
          result[3]
        }</li>
        <li class="list-group-item"><b>Stake:</b> ${web3.utils.fromWei(
          result[5],
          "ether",
        )} ETH <b>Withdrawn:</b> ${result[6]}</li>`;
        $readSpinner.classList.add("d-none");
      })
      .catch((_e) => {
        $readResultTable.classList.add("d-none");
        $readResult.classList.remove("d-none");
        $readResult.classList.add("alert-danger");
        $readResult.innerHTML = `Error while trying to read participant ${id}`;
        $readSpinner.classList.add("d-none");
      });
  });

  $edit.addEventListener("submit", (e) => {
    e.preventDefault();
    const add = e.target.elements[0].value;
    $editSpinner.classList.remove("d-none");
    compete.methods
      .update(add)
      .send({ from: accounts[0] })
      .then((result) => {
        $editResult.classList.remove("d-none");
        $editResult.classList.remove("alert-danger");
        $editResult.innerHTML = `Success, participant updated`;
        $editSpinner.classList.add("d-none");
      })
      .catch((_e) => {
        $editResult.classList.remove("d-none");
        $editResult.classList.add("alert-danger");
        $editResult.innerHTML = `Error while trying to update participant ${id}`;
        $editSpinner.classList.add("d-none");
      });
  });

  $withdraw.addEventListener("submit", (e) => {
    e.preventDefault();
    $withdrawSpinner.classList.remove("d-none");
    compete.methods
      .withdraw(true)
      .send({ from: accounts[0] })
      .then((result) => {
        console.log("Result", result);

        $withdrawResult.classList.remove("d-none");
        $withdrawResult.classList.remove("alert-danger");
        $withdrawResult.innerHTML = `Success, transaction in block ${
          result.blockNumber
        }`;
        $withdrawSpinner.classList.add("d-none");

        updateUserBalance();
      })
      .catch((_e) => {
        console.log("Error", _e);
        $withdrawResult.classList.remove("d-none");
        $withdrawResult.classList.add("alert-danger");
        $withdrawResult.innerHTML = `Error while trying to withdraw ${
          _e.message
        }`;
        $withdrawSpinner.classList.add("d-none");
      });
  });
};

const updateContractBalance = () => {
  const $contractBalance = document.getElementById("contract-balance-info");
  const $newContractBalance = document.getElementById(
    "new-contract-balance-info",
  );
  const $transactionContractBalance = document.getElementById(
    "transaction-contract-balance-info",
  );

  web3.eth.getBalance(globalContractAddress).then((_balance) => {
    let balance = web3.utils.fromWei(_balance, "ether");
    console.log("Contract balance", balance);
    $contractBalance.href = $newContractBalance.href = $transactionContractBalance.href = `https://ropsten.etherscan.io/address/${globalContractAddress}`;
    $contractBalance.innerHTML = $newContractBalance.innerHTML = $transactionContractBalance.innerHTML = `Contract Balance: ${balance} ETH`;
  });
};

const updateUserBalance = () => {
  const $balanceInfo = document.getElementById("balance-info");
  const $balanceInfoWithdraw = document.getElementById("withdraw-balance-info");

  web3.eth.getBalance(globalUserAccount).then((_balance) => {
    let prevBalance = globalUserBalance;
    let balance = web3.utils.fromWei(_balance, "ether");
    globalUserBalance = balance;
    console.log("User balance", balance);
    $balanceInfo.href = $balanceInfoWithdraw.href = `https://ropsten.etherscan.io/address/${globalUserAccount}`;
    $balanceInfo.innerHTML = `Balance: ${balance} ETH`;
    $balanceInfoWithdraw.innerHTML = `Balance: ${balance} ETH, change: ${balance -
      prevBalance} ETH`;
  });
};

document.addEventListener("DOMContentLoaded", () => {
  initWeb3()
    .then((_web3) => {
      web3 = _web3;
      compete = initContract();
      initNavigation();
      initApp();
    })
    .catch((e) => console.log(e.message));
});
