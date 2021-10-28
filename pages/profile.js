import { ethers } from 'ethers'
import { useEffect, useState } from 'react'
import { create as ipfsHttpClient } from 'ipfs-http-client'
import axios from 'axios'
import Web3Modal from "web3modal"
import Image from 'next/image'

import { useRouter } from 'next/router'
import Link from 'next/link'
import {
  nftmarketaddress, nftaddress
} from '../config'

import Market from '../artifacts/contracts/Market.sol/NFTMarket.json'
import NFT from '../artifacts/contracts/NFT.sol/NFT.json'

import { initializeApp, getApps } from "firebase/app"
import { getStorage, ref, listAll } from "firebase/storage";
import { getFirestore, collection, addDoc, getDocs } from "firebase/firestore";

const client = ipfsHttpClient('https://ipfs.infura.io:5001/api/v0')

export default function MyCollection() {
  const [nfts, setNfts] = useState([])
  const [sold, setSold] = useState([])
  const [bought, setBought] = useState([])
  const [timers, updateTimers] = useState([])
  const [showModal, setShowModal] = useState(false);
  const [loadingState, setLoadingState] = useState('not-loaded')
  const [address, setAddress] = useState('')
  const [balance, setBalance] = useState(0)
  const router = useRouter()
  const { authorAddress } = router.query
  const [formInput, updateFormInput] = useState({ fileUrl: '', owner: '' })
  const [showMessage, setShowMessage] = useState('')
  const [showModalIPFS, setShowModalIPFS] = useState(false);
  const [fileUrl, setFileUrl] = useState(null)
  const [fileUploadProgress, setFileUploadProgress] = useState(null)
  const [showModalChecking, setShowModalChecking] = useState(false);

  async function getMETT(currentAccount) {
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
  async function verifyAsset() {
    setShowMessage('')
    setShowModalChecking(true)
    await new Promise(resolve => setTimeout(resolve, 3000)); // 3 sec
    setShowModalChecking(false)
    setShowMessage("Verification of the uploaded digital asset has been completed successfully.")
  }
  async function checkFirebase(url) {
    const params = new URLSearchParams({ authorAddress: formInput.owner });
    router.push({
      pathname: '/profile',
      search: params
    })
    setShowModalChecking(true)
    setShowMessage("")
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

    try {

      if (!getApps().length) {
        //....
      }

      const app = initializeApp(firebaseConfig)

      const db = getFirestore(app)
      //const auth = getAuth(app)

      const nounsRef = collection(db, "licensing");
      const q = query(nounsRef,
        where("fileUrl", "==", formInput.fileUrl),
        where("owner", "==", formInput.owner));

      const querySnapshot = await getDocs(q);
      const items = [];
      querySnapshot.forEach((doc) => {
        let data = doc.data();
        let item = {
          id: doc.id,
          price: data.price,
          name: data.name,
          image: data.fileUrl,
          owner: data.owner,
          seller: data.seller,
          sold: data.sold
        }

        items.push(item)
      })
      setNfts(items)
      if (items.length == 0) {
        setShowMessage("Sorry. We cannot find any matching records.")
      }
    } catch(err){
      if (!/already exists/.test(err.message)) {
        console.error('Firebase initialization error', err.stack)}
    }
    setShowModalChecking(false)
  }
  // For now, 'eth_accounts' will continue to always return an array
  function handleAccountsChanged(accounts) {
    if (accounts.length === 0) {
      // MetaMask is locked or the user has not connected any accounts
      console.log('Please connect to MetaMask.');
    } else if (accounts[0] !== address) {
      setAddress(accounts[0]);
      console.log("currentAccount", accounts[0]);
      getMETT(accounts[0]);
    }
  }
  async function onChange(e) {
    setFileUrl(null)
    setShowModalIPFS(true)
    const file = e.target.files[0]
    try {
      const added = await client.add(
        file,
        {
          progress: (prog) => console.log(`received: ${prog}`)
        }
      )
      const url = `https://ipfs.infura.io/ipfs/${added.path}`
      setFileUrl(url)
      setShowModalIPFS(false)
    } catch (error) {
      console.log('Error uploading file: ', error)
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

      const bougntItems = items.filter(i => i.owner === (authorAddress || address))
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
  if (showModalIPFS) return (
    <div className="p-4">
      <p>Please wait while we upload your asset.</p>
      <p>{fileUploadProgress}</p>
      <div className="loader"></div>
    </div>
  )
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
  if (showModalChecking) return (
    <div className="p-4">
      <p>Please wait while we check your asset.</p>
      <div className="loader"></div>
    </div>
  )
  if (showMessage) return (
    <div className="p-4">
      <p>{showMessage}</p>
    </div>
  )
  return (
    <div>
      <div className="header">{address}</div>
      <main>
        <section className="py-5 text-center container">
          <div className="row py-lg-5">
            <div className="col-lg-6 col-md-8 mx-auto">
              <h1 className="fw-light">Applicant Profile</h1>
              <p className="lead text-muted">Showcase your digital assets.</p>
            </div>
          </div>
        </section>
        <div className="album py-5 bg-light">
          <div className="container">
            <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 g-3">
              {
                bought.map((nft, i) => (
                  <div key={i} className="col">
                    <div className="card shadow-sm">
                      <div>
                        <embed
                           src={nft.image}
                           width="100%"
                           height="100%" />
                      </div>
                      <div className="card-body">
                      <h5 className="card-title">{nft.name}</h5>
                      <p className="card-text">{nft.description}</p>
                      <p className="card-text"><small className="text-muted">{nft.seller}</small></p>
                      <div className="d-flex justify-content-between align-items-center">
                        <div className="btn-group">
                          <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => copyUrl(nft)}>Copy NFT</button>
                        </div>
                        <small className="text-muted">{nft.price} MATIC</small>
                      </div>
                      </div>
                    </div>
                  </div>
                ))
              }
            </div>
          </div>
        </div>
      </main>
      <div className="p-4">
        <h2 className="text-2xl">Please use the Choose File button to verify ownership of a digital asset.</h2>
      </div>
      <div className="flex justify-center">
        <div className="w-1/2 flex flex-col pb-12">
          <input
            type="file"
            name="Asset"
            className="my-4"
            onChange={onChange}
            accept=".pdf"
          />
          <embed
             src={fileUrl}
             width="250"
             height="200" />
          {
            fileUrl &&
            <button className="w-full bg-pink-500 text-white font-bold py-2 px-12 rounded" onClick={verifyAsset}>
              Verify Digital Asset
            </button>
          }
        </div>
      </div>
    </div>
  )
}
