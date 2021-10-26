
import { useEffect, useState } from 'react'
import { ethers } from 'ethers'
import { create as ipfsHttpClient } from 'ipfs-http-client'
import { useRouter } from 'next/router'
import Web3Modal from 'web3modal'
import Image from 'next/image'
import { initializeApp, getApps } from "firebase/app"
import { getFirestore, collection, addDoc, getDocs, query, orderBy, limit, where } from "firebase/firestore";
import { getAuth } from "firebase/auth"
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";

const client = ipfsHttpClient('https://ipfs.infura.io:5001/api/v0')

import {
  nftaddress, nftmarketaddress
} from '../config'

import NFT from '../artifacts/contracts/NFT.sol/NFT.json'
import Market from '../artifacts/contracts/Market.sol/NFTMarket.json'

export default function CreateItem() {
  const [nfts, setNfts] = useState([])
  const [fileUrl, setFileUrl] = useState(null)
  const [fileUploadProgress, setFileUploadProgress] = useState(null)
  const [showModalIPFS, setShowModalIPFS] = useState(false);
  const [showModalChecking, setShowModalChecking] = useState(false);
  const [formInput, updateFormInput] = useState({ fileUrl: '', owner: '' })
  const router = useRouter()
  const [address, setAddress] = useState('')
  const [optionsState, setOptionsState] = useState('')
  const [src, setSrc] = useState('')
  const [isImageReady, setIsImageReady] = useState(false);

  // For now, 'eth_accounts' will continue to always return an array
  function handleAccountsChanged(accounts) {
    if (accounts.length === 0) {
      // MetaMask is locked or the user has not connected any accounts
      console.log('Please connect to MetaMask.');
    } else if (accounts[0] !== address) {
      setAddress(accounts[0]);
      console.log("currentAccount", accounts[0]);
      //getMETT(accounts[0]);
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
  async function onChange(e) {
    setFileUrl(null)
    setShowModalIPFS(true)
    const file = e.target.files[0]
    setSrc(URL.createObjectURL(event.target.files[0]))
    try {
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
      const firebaseApp = initializeApp(firebaseConfig)
      // Get a reference to the storage service, which is used to create references in your storage bucket
      const storage = getStorage(firebaseApp);
      const storageRef = ref(storage, `nft/${file.name}`);

      const uploadTask = uploadBytesResumable(storageRef, file);

      // Register three observers:
      // 1. 'state_changed' observer, called any time the state changes
      // 2. Error observer, called on failure
      // 3. Completion observer, called on successful completion
      uploadTask.on('state_changed',
        (snapshot) => {
          // Observe state change events such as progress, pause, and resume
          // Get task progress, including the number of bytes uploaded and the total number of bytes to be uploaded
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log('Upload is ' + progress + '% done');
          setFileUploadProgress('Upload is ' + progress + '% done');
          switch (snapshot.state) {
            case 'paused':
              console.log('Upload is paused');
              break;
            case 'running':
              console.log('Upload is running');
              break;
          }
        },
        (error) => {
          // Handle unsuccessful uploads

        },
        () => {
          // Handle successful uploads on complete
          // For instance, get the download URL: https://firebasestorage.googleapis.com/...
          getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
            console.log('File available at', downloadURL);
            setFileUrl(downloadURL)
          });
          setShowModalIPFS(false)
        }
      );

      // const added = await client.add(
      //   file,
      //   {
      //     progress: (prog) => console.log(`received: ${prog}`)
      //   }
      // )
      // const url = `https://ipfs.infura.io/ipfs/${added.path}`
      //setFileUrl(url)
    } catch (error) {
      console.log('Error uploading file: ', error)
    }
  }
  async function createMarket() {
    const { name, description, price } = formInput
    if (!name || !description || !price || !fileUrl) return
    /* first, upload to IPFS */
    const data = JSON.stringify({
      name, description, image: fileUrl
    })
    try {
      const added = await client.add(data)
      const url = `https://ipfs.infura.io/ipfs/${added.path}`
      /* after file is uploaded to IPFS, pass the URL to save it on Polygon */
      //createSale(url)
      createFirebase(url)
    } catch (error) {
      console.log('Error uploading file: ', error)
    }
  }
  function getRndInteger(min, max) {
    return Math.floor(Math.random() * (max - min) ) + min;
  }

  function handleChange(event) {
    setOptionsState(event.target.value);
  }
  async function checkFirebase(url) {
    setShowModalChecking(true)

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
    } catch(err){
      if (!/already exists/.test(err.message)) {
        console.error('Firebase initialization error', err.stack)}
    }
    setShowModalChecking(false)
  }

  if (showModalChecking) return (
    <div className="p-4">
      <p>Please wait while we check your asset.</p>
      <div className="loader"></div>
    </div>
  )
  return (
    <div>
      <div className="header">{address}</div>
    <div className="p-4">
      <h2 className="text-2xl py-2">Please use the Choose File button to upload your asset.</h2>
    </div>
    <div className="flex justify-center">
      <div className="w-1/2 flex flex-col pb-12">
        <select value={optionsState} onChange={handleChange}>
          <option value="" disabled default>Select your digital asset category</option>
          <option value="Patent">Patent</option>
          <option value="Trade Mark">Trade Mark</option>
          <option value="Copyright">Copyright</option>
        </select>
        <input
          placeholder="Asset Url"
          className="mt-8 border rounded p-4"
          value={formInput.fileUrl}
          onChange={e => updateFormInput({ ...formInput, fileUrl: e.target.value })}
        />
        <input
          placeholder="Owner Address"
          className="mt-8 border rounded p-4"
          value={formInput.owner}
          onChange={e => updateFormInput({ ...formInput, owner: e.target.value })}
        />
        {
          nfts.map((nft, i) => (
            <div key={i} className="border shadow rounded-xl overflow-hidden bg-black">
              <embed
                 src={nft.image}
                 width="250"
                 height="200" />
              <div className="p-4 bg-white">
                <p style={{ height: '64px' }} className="text-2xl font-semibold">{nft.name}</p>
                <div style={{ height: '70px', overflow: 'hidden' }}>
                  <p className="text-gray-400">{nft.description}</p>
                </div>
              </div>
                <div className="p-4 bg-black">
                  <p className="text-2xl mb-4 font-bold text-white">{nft.priceDesc} MATIC</p>
                </div>
            </div>
          ))
        }
        {
          (nfts.length == 0) &&
          <div className="p-4">
            <p>Sorry. We cannot find any matching records.</p>
          </div>
        }
        <button className="w-full bg-pink-500 text-white font-bold py-2 px-12 rounded" onClick={checkFirebase}>
          Check Digital Asset
        </button>
      </div>
    </div>
    </div>
  )
}
