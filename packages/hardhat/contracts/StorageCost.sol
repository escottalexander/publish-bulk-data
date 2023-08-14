//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

contract StorageCost {
	Child[] public children;
	string[] public storedData;

	event emitData(string data);

	function storeDataInChildContract(string memory data) external {
		Child child = new Child(data, children.length);
		children.push(child);
	}

	function readChildData(uint index) external view returns (string memory) {
		return children[index].data();
	}

	function readRecentChildData() external view returns (string memory) {
		if (children.length == 0) {
			return "";
		}
		return children[children.length - 1].data();
	}

	function storeDataInSelf(string memory data) external {
		storedData.push(data);
	}

	function readDataFromSelf(
		uint index
	) external view returns (string memory) {
		return storedData[index];
	}

	function readRecentDataFromSelf() external view returns (string memory) {
		if (storedData.length == 0) {
			return "";
		}
		return storedData[storedData.length - 1];
	}

	function emitDataAsEvent(string calldata data) external {
		emit emitData(data);
	}
}

contract Child {
	string public data;
	uint public index;

	constructor(string memory _data, uint _index) {
		data = _data;
		index = _index;
	}
}
