import { useEffect, useState } from "react";
import type { NextPage } from "next";
import { Abi, decodeEventLog, formatEther, formatUnits } from "viem";
import { usePublicClient } from "wagmi";
import { InformationCircleIcon } from "@heroicons/react/24/outline";
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
        <div className="grid grid-flow-col gap-4 w-5/6">
          <div className="grid gap-2 place-self-start">
            <button className="btn" onClick={() => emitEventData({})} disabled={!data}>
              Publish as event data
            </button>
            <div tabIndex={0} className="border border-base-300 bg-base-100 rounded-box">
              <div className="text-xl font-medium flex row items-center">
                <InformationCircleIcon className="h-6 w-6 m-3" /> Why would I use this?
              </div>
              <div className="px-2">
                <p>
                  This is by far the cheapest option when it comes to putting data onchain. The big caveat is that event
                  data can not be used from within the chain. No composability is possible. This is an ideal storage
                  place for any data that you do not need to change but you do want to protect from censorship.
                </p>
              </div>
            </div>
          </div>
          <div className="grid gap-2 place-self-start">
            <button className="btn" onClick={() => writeContractData({})} disabled={!data}>
              Publish as contract data
            </button>
            <div tabIndex={0} className="border border-base-300 bg-base-100 rounded-box">
              <div className="text-xl font-medium flex row items-center">
                <InformationCircleIcon className="h-6 w-6 m-3" /> Why would I use this?
              </div>
              <div className="px-2">
                <p>
                  This is not cheap but it is ideal for any data that needs some composability. For instance, a SVG NFT
                  project that builds the asset from stored SVG fragments each time the URI is requested would need to
                  store the data in this or the next way.
                </p>
              </div>
            </div>
          </div>
          <div className="grid gap-2 place-self-start">
            <button className="btn" onClick={() => writeSeparateContractData({})} disabled={!data}>
              Publish as separate contract
            </button>
            <div tabIndex={0} className="border border-base-300 bg-base-100 rounded-box">
              <div className="text-xl font-medium flex row items-center">
                <InformationCircleIcon className="h-6 w-6 m-3" />
                <span>Why would I use this?</span>
              </div>
              <div className="px-2">
                <p>
                  Storing content in it&apos;s own contract is generally the most expensive solution listed here but it
                  comes with a few extra benefits on top of all the benefits listed in the last method. You can deploy
                  the contract with whatever logic you need to shape the data while also being careful not to exceed
                  constraints based on gas limits. This is the most composable way of storign data.
                </p>
              </div>
            </div>
          </div>
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
