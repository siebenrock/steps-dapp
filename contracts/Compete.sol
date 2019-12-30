pragma solidity ^0.5.0;

contract Compete {

  Participant[] public participants;
  uint public nextId = 1;
  uint256 endTime;
  uint winnerStake;

  struct Participant {
    uint id;
    string name;
    uint stepsCurrent;
    uint stepsGoal;
    address payable _address;
    uint stake;
    bool withdrawn;
  }

  constructor () public {
    uint256 endTime = block.timestamp + 7 days;
  }

  function getTimeRemaining() view public returns(uint256) {
    return(endTime - block.timestamp);
  }

  function participate(string memory name, uint stepsCurrent, uint stepsGoal) payable public {
    uint i = findByAddress(msg.sender);
    if (i != 0) {
      participants[i - 1].name = name;
      participants[i - 1].stepsCurrent = stepsCurrent;
      participants[i - 1].stepsGoal = stepsGoal;
      participants[i - 1].withdrawn = false;
    } else {
      participants.push(Participant(nextId, name, stepsCurrent, stepsGoal, msg.sender, 0, false));
      nextId++;
    }
  }

  function pay() external payable returns(bool) {
    uint i = findByAddress(msg.sender);
    if (i != 0) {
      participants[i - 1].stake += msg.value;
      return true;
    }
    return false;
  }

  function info(address _address) view public returns(uint, string memory, uint, uint, address, uint, bool) {
    uint i = findByAddress(_address);
    if (i != 0) {
      return(participants[i - 1].id, participants[i - 1].name, participants[i - 1].stepsCurrent, participants[i - 1].stepsGoal, participants[i - 1]._address, participants[i - 1].stake, participants[i - 1].withdrawn);
    }
  }

  function infoByID(uint id) view public returns(uint, string memory, uint, uint, address, uint) {
    uint i = findByID(id);
    Participant memory cParticipant = participants[i];
    return(cParticipant.id, cParticipant.name, cParticipant.stepsCurrent, cParticipant.stepsGoal, cParticipant._address, cParticipant.stake);
  }

  function update(uint stepsAdd) public {
    if(stepsAdd >= 0) {
      uint i = findByAddress(msg.sender);
      if (i != 0) {
        participants[i - 1].stepsCurrent += stepsAdd;
        participants[i - 1].withdrawn = false;
      }
    }
  }

  function withdraw(bool completed) public {
    uint i = findByAddress(msg.sender);
    uint balance = address(this).balance;

    // Complete = true and withdraw full own stake for dev, instead of proportion of stake
    if (i != 0 && (endTime < block.timestamp || completed)) {
      if (participants[i - 1].stepsCurrent >= participants[i - 1].stepsGoal && participants[i - 1].withdrawn == false) {
        participants[i - 1]._address.transfer(participants[i - 1].stake);
        participants[i - 1].withdrawn = true;
        participants[i - 1].stake = 0;
      }
    }
  }

  function getWinnersStake() public {
    for(uint j = 0; j < participants.length; j++) {
      if (participants[j].stepsCurrent >= participants[j].stepsGoal) {
        winnerStake += participants[j].stake;
      }
    }
  }

  function findByID(uint id) view internal returns(uint) {
    for(uint i = 0; i < participants.length; i++) {
      if(participants[i].id == id) {
        return i;
      }
    }
    revert('Participant not found');
  }

  function findByAddress(address _address) view internal returns(uint) {
    for(uint i = 0; i < participants.length; i++) {
      if(participants[i]._address == _address) {
        return i + 1;
      }
    }
    return 0;
  }

}
