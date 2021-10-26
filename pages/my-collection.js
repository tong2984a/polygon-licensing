import { ethers } from 'ethers'
import { useEffect, useState } from 'react'
import axios from 'axios'
import Web3Modal from "web3modal"
import Image from 'next/image'

import {
  nftmarketaddress, nftaddress
} from '../config'

import Market from '../artifacts/contracts/Market.sol/NFTMarket.json'
import NFT from '../artifacts/contracts/NFT.sol/NFT.json'

import { initializeApp, getApps } from "firebase/app"
import { getStorage, ref, listAll } from "firebase/storage";
import { getFirestore, collection, addDoc, getDocs } from "firebase/firestore";

export default function MyCollection() {
  const [nfts, setNfts] = useState([])
  const [sold, setSold] = useState([])
  const [bought, setBought] = useState([])
  const [timers, updateTimers] = useState([])
  const [showModal, setShowModal] = useState(false);
  const [loadingState, setLoadingState] = useState('not-loaded')
  const [address, setAddress] = useState('')
  const [balance, setBalance] = useState(0)

  async function getMETT(currentAccount) {
    console.log("****getMETT address", currentAccount);
    const web3Modal = new Web3Modal()
    const connection = await web3Modal.connect()
    const provider = new ethers.providers.Web3Provider(connection)
    const signer = provider.getSigner()

    /* next, create the item */
    let contract = new ethers.Contract(nftaddress, NFT.abi, signer)

    const tokenBalance = await contract.balanceOf(currentAccount);
    console.log({ tokenBalance: tokenBalance.toString() });
    setBalance(tokenBalance.toString())
  }

  // For now, 'eth_accounts' will continue to always return an array
  function handleAccountsChanged(accounts) {
    console.log("****accounts,", accounts)
    if (accounts.length === 0) {
      // MetaMask is locked or the user has not connected any accounts
      console.log('Please connect to MetaMask.');
    } else if (accounts[0] !== address) {
      setAddress(accounts[0]);
      console.log("currentAccount", accounts[0]);
      getMETT(accounts[0]);
    }
  }
  useEffect(() => {
    if (window.ethereum) {
      window.ethereum
        .request({ method: 'eth_requestAccounts' })
        .then(handleAccountsChanged)
        .catch((err) => {
          if (err.code === 4001) {
            // EIP-1193 userRejectedRequest error
            // If this happens, the user rejected the connection request.
            console.log('Please connect to MetaMask.');
          } else {
            console.error(err);
          }
        });
      window.ethereum.on('accountsChanged', handleAccountsChanged);
    } else {
      console.log("Non-Ethereum browser detected. You should consider installing MetaMask.");
      setAddress("Non-Ethereum browser detected. You should consider installing MetaMask.")
    }
    return function cleanup() {
      //mounted = false
    }
  }, [])

  useEffect(() => {
    //loadNFTs()

    async function loadFirebase() {
      const firebaseConfig = {
        // INSERT YOUR OWN CONFIG HERE
        apiKey: "AIzaSyBg34hCq_jGHdj-HNWi2ZjfqhM2YgWq4ek",
        authDomain: "pay-a-vegan.firebaseapp.com",
        databaseURL: "https://pay-a-vegan.firebaseio.com",
        projectId: "pay-a-vegan",
        storageBucket: "pay-a-vegan.appspot.com",
        messagingSenderId: "587888386485",
        appId: "1:587888386485:web:3a81137924d19cbe2439fc",
        measurementId: "G-MGJK6GF9YW"
      };

      const app = initializeApp(firebaseConfig)

      const db = getFirestore(app)
      //const auth = getAuth(app)

      const querySnapshot = await getDocs(collection(db, "licensing"));
      const items = [];
      querySnapshot.forEach((doc) => {
        let vote = doc.data();
        let item = {
          id: doc.id,
          price: vote.price,
          image: vote.fileUrl,
          name: vote.name,
          description: vote.description,
          sold: vote.sold,
          seller: vote.seller,
          owner: vote.owner,
          rfp: vote.rfp,
          rating: vote.rating
        }
        items.push(item)
      })

      //const myItems = items.filter(i => i.seller === address)
      //console.log("myItems", myItems)
      const bougntItems = items.filter(i => i.owner === address)
      //setNfts(myItems)
      setBought(bougntItems)
      setLoadingState('loaded')
    }
    loadFirebase()
    return function cleanup() {
      //mounted = false
    }
  }, [address])
  function copyUrl(nft) {
    navigator.clipboard.writeText(nft.image);
    navigator.clipboard.writeText(nft.image)
         .then(() => alert("Copied the text: " + nft.image))
  }
  async function loadNFTs() {
    const web3Modal = new Web3Modal({
      network: "mainnet",
      cacheProvider: true,
    })
    const connection = await web3Modal.connect()
    const provider = new ethers.providers.Web3Provider(connection)
    const signer = provider.getSigner()

    const marketContract = new ethers.Contract(nftmarketaddress, Market.abi, signer)
    const tokenContract = new ethers.Contract(nftaddress, NFT.abi, provider)
    const data = await marketContract.fetchItemsCreated()

    const items = await Promise.all(data.map(async i => {
      const tokenUri = await tokenContract.tokenURI(i.tokenId)
      const meta = await axios.get(tokenUri)
      let price = ethers.utils.formatUnits(i.price.toString(), 'ether')
      let item = {
        price,
        tokenId: i.tokenId.toNumber(),
        seller: i.seller,
        owner: i.owner,
        sold: i.sold,
        auction: i.auction,
        endTime: i.endTime,
        image: meta.data.image,
      }
      return item
    }))

    const boughtData = await marketContract.fetchMyNFTs()

    const bougntItems = await Promise.all(boughtData.map(async i => {
      const tokenUri = await tokenContract.tokenURI(i.tokenId)
      const meta = await axios.get(tokenUri)
      let price = ethers.utils.formatUnits(i.price.toString(), 'ether')
      let item = {
        price,
        tokenId: i.tokenId.toNumber(),
        seller: i.seller,
        owner: i.owner,
        sold: i.sold,
        image: meta.data.image,
      }
      return item
    }))
    /* create a filtered array of items that have been sold */
    const soldItems = items.filter(i => i.sold)
    setSold(soldItems)
    setNfts(items)
    setBought(bougntItems)
    setLoadingState('loaded')
  }
  if (showModal) return (
    <div className="p-4">
      <div className="header">{address}</div>
      <p>Please wait. Your METAMASK wallet will prompt you once for putting your creative work up on auction.</p>
      <div className="loader"></div>
    </div>
  )
  if ((loadingState === 'loaded') && (nfts.length == 0) && (bought.length == 0)) return (
    <div className="p-4">
      <div className="header">{address}</div>
      <h1 className="py-10 px-20 text-3xl">No assets created</h1>
    </div>
  )
  return (
    <div>
      <div className="header">{address}</div>
      <div className="p-4">
        <h2 className="text-2xl py-2">My Collection - where you can find your license purchases.</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
          {
            bought.map((nft, i) => (
              <div key={i} className="border shadow rounded-xl overflow-hidden bg-black">
                <embed
                   src={nft.image}
                   width="250"
                   height="200" />
                <div className="p-4 bg-white">
                  <p style={{ height: '64px' }} className="text-2xl font-semibold">{nft.name}</p>
                  <div style={{ height: '70px', overflow: 'hidden' }}>
                    <p className="text-gray-400">AI Rating: {nft.rating}</p>
                    <p className="text-gray-400">Asset Category: {nft.rfp}</p>
                    <p className="text-gray-400">Description: {nft.description}</p>
                  </div>
                </div>
                <div className="p-4 bg-black">
                  <p className="text-2xl font-bold text-red-500">Cost - {nft.price} MATIC</p>
                  <button className="w-full bg-pink-500 text-white font-bold py-2 px-12 rounded" onClick={() => copyUrl(nft)}>
                    Copy NFT
                  </button>
                </div>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  )
}
