import { useEffect, useState } from "react";
import type { NextPage } from "next";
import { Abi, decodeEventLog, formatEther, formatUnits } from "viem";
import { usePublicClient } from "wagmi";
import { MetaHeader } from "~~/components/MetaHeader";
import { useDeployedContractInfo, useScaffoldContractRead, useScaffoldContractWrite } from "~~/hooks/scaffold-eth";

const Home: NextPage = () => {
  const contract = useDeployedContractInfo("StorageCost")?.data;
  const client = usePublicClient();
  const [data, setData] = useState("");
  const [bytes, setBytes] = useState(0);
  const [gasUsed, setGasUsed] = useState("0");
  const [gasPrice, setGasPrice] = useState("0");
  const [totalFee, setTotalFee] = useState("0");

  const [displayedData, setDisplayedData] = useState("");
  const [emitDataLogs, setEmitDataLogs] = useState("");
  const { writeAsync: emitEventData, isLoading: loadingEmitEvent } = useScaffoldContractWrite({
    contractName: "StorageCost",
    functionName: "emitDataAsEvent",
    args: [data],
    onBlockConfirmation: txnReceipt => {
      setDisplayedData("");
      console.log("📦 Transaction blockHash", txnReceipt.blockHash);
      setGasMetrics(txnReceipt.cumulativeGasUsed, txnReceipt.effectiveGasPrice);
      const { data: logData, topics } = txnReceipt.logs[0];
      const decodedEvent = decodeEventLog({
        abi: contract?.abi as Abi,
        data: logData,
        topics,
      });
      setEmitDataLogs((decodedEvent.args as { data: string }).data);
    },
  });

  const { writeAsync: writeContractData, isLoading: loadingContractData } = useScaffoldContractWrite({
    contractName: "StorageCost",
    functionName: "storeDataInSelf",
    args: [data],
    onBlockConfirmation: txnReceipt => {
      setDisplayedData("");
      console.log("📦 Transaction blockHash", txnReceipt.blockHash);
      setGasMetrics(txnReceipt.cumulativeGasUsed, txnReceipt.effectiveGasPrice);
    },
  });

  const { data: readRecentDataFromSelf } = useScaffoldContractRead({
    contractName: "StorageCost",
    functionName: "readRecentDataFromSelf",
  });

  const { writeAsync: writeSeparateContractData, isLoading: loadingSeparateContractData } = useScaffoldContractWrite({
    contractName: "StorageCost",
    functionName: "storeDataInChildContract",
    args: [data],
    onBlockConfirmation: txnReceipt => {
      setDisplayedData("");
      console.log("📦 Transaction blockHash", txnReceipt.blockHash);
      setGasMetrics(txnReceipt.cumulativeGasUsed, txnReceipt.effectiveGasPrice);
    },
  });

  const setGasMetrics = (gasUsed: bigint, gasPrice: bigint) => {
    setGasUsed(formatUnits(gasUsed, 0));
    setGasPrice(parseFloat(formatUnits(gasPrice, 9)).toFixed(4));
    setTotalFee(parseFloat(formatEther(gasPrice * gasUsed)).toFixed(6));
  };

  const { data: readRecentDataFromChild } = useScaffoldContractRead({
    contractName: "StorageCost",
    functionName: "readRecentChildData",
  });

  useEffect(() => {
    setBytes(new Blob([data]).size);
  }, [data, client]);

  useEffect(() => {
    setDisplayedData(emitDataLogs);
  }, [emitDataLogs]);

  useEffect(() => {
    setDisplayedData(readRecentDataFromSelf as string);
  }, [readRecentDataFromSelf]);

  useEffect(() => {
    setDisplayedData(readRecentDataFromChild as string);
  }, [readRecentDataFromChild]);
  return (
    <>
      <MetaHeader />
      <div className="flex items-center flex-col flex-grow pt-10">
        <textarea
          className="textarea textarea-lg rounded w-5/6"
          onChange={event => setData(event.target.value)}
          placeholder="Paste data here"
        ></textarea>
        <span className="badge badge-lg m-4 badge-outline">{bytes} bytes of data</span>
        <div className="row">
          <button className="btn m-2" onClick={() => emitEventData({})} disabled={!data}>
            Publish as event data
          </button>
          <button className="btn m-2" onClick={() => writeContractData({})} disabled={!data}>
            Publish as contract data
          </button>
          <button className="btn m-2" onClick={() => writeSeparateContractData({})} disabled={!data}>
            Publish as separate contract
          </button>
        </div>

        {loadingEmitEvent || loadingContractData || loadingSeparateContractData ? (
          <p>Loading...</p>
        ) : (
          <div className="text-center rounded-box bg-base-300 w-5/6 p-6 mt-6">
            {displayedData ? (
              <div className="row space-between">
                <span className="badge badge-lg m-2 badge-outline">Gas Price: {gasPrice} GWEI</span>
                <span className="badge badge-lg m-2 badge-outline">Gas Units: {gasUsed}</span>
                <span className="badge badge-lg m-2 badge-outline">Total Fee: {totalFee} ETH</span>
              </div>
            ) : (
              ""
            )}
            <h3 className="text-xl m-2">Published data from onchain:</h3>
            <p>{displayedData}</p>
          </div>
        )}
      </div>
    </>
  );
};

export default Home;
