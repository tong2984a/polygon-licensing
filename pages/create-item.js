
import { useEffect, useState } from 'react'
import { ethers } from 'ethers'
import { create as ipfsHttpClient } from 'ipfs-http-client'
import { useRouter } from 'next/router'
import Web3Modal from 'web3modal'
import Image from 'next/image'
import { initializeApp, getApps } from "firebase/app"
import { getFirestore, collection, addDoc, getDocs } from "firebase/firestore";
import { getAuth } from "firebase/auth"
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";

const client = ipfsHttpClient('https://ipfs.infura.io:5001/api/v0')

import {
  nftaddress, nftmarketaddress
} from '../config'

import NFT from '../artifacts/contracts/NFT.sol/NFT.json'
import Market from '../artifacts/contracts/Market.sol/NFTMarket.json'

export default function CreateItem() {
  const [fileUrl, setFileUrl] = useState(null)
  const [fileUploadProgress, setFileUploadProgress] = useState(null)
  const [showModalIPFS, setShowModalIPFS] = useState(false);
  const [showModalMint, setShowModalMint] = useState(false);
  const [formInput, updateFormInput] = useState({ price: '', name: '', description: '' })
  const router = useRouter()
  const [address, setAddress] = useState('')
  const [optionsState, setOptionsState] = useState('')

  // For now, 'eth_accounts' will continue to always return an array
  function handleAccountsChanged(accounts) {
    console.log("****accounts,", accounts)
    if (accounts.length === 0) {
      // MetaMask is locked or the user has not connected any accounts
      console.log('Please connect to MetaMask.');
    } else if (accounts[0] !== address) {
      setAddress(accounts[0]);
      console.log("currentAccount", accounts[0]);
      //getMETT(accounts[0]);
    }
  }
  function connect() {
    console.log("****connect");
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
  }
  useEffect(() => {
    connect()
    window.ethereum.on('accountsChanged', handleAccountsChanged);
    return function cleanup() {
      //mounted = false
    }
  }, [])

  async function onChange(e) {
    setShowModalIPFS(true)
    const file = e.target.files[0]
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
  async function createFirebase(url) {
    setShowModalMint(true)

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

      const colRef = collection(db, 'licensing')
      //
      // const web3Modal = new Web3Modal()
      // const connection = await web3Modal.connect()
      // const provider = new ethers.providers.Web3Provider(connection)
      // const signer = provider.getSigner()

      addDoc(colRef, {
        name: formInput.name,
        description: formInput.description,
        price: formInput.price,
        fileUrl: fileUrl,
        seller: address,
        owner: address,
        rfp: optionsState,
        rating: getRndInteger(30, 99)
      });
    } catch(err){
      if (!/already exists/.test(err.message)) {
        console.error('Firebase initialization error', err.stack)}
    }
    setShowModalMint(false)
    router.push('/')
  }

  async function createSale(url) {
    setShowModalMint(true)
    const web3Modal = new Web3Modal()
    const connection = await web3Modal.connect()
    const provider = new ethers.providers.Web3Provider(connection)
    const signer = provider.getSigner()

    /* next, create the item */
    let contract = new ethers.Contract(nftaddress, NFT.abi, signer)
    let transaction = await contract.createToken(url)
    let tx = await transaction.wait()
    let event = tx.events[0]
    let value = event.args[2]
    let tokenId = value.toNumber()

    const price = ethers.utils.parseUnits(formInput.price, 'ether')

    /* then list the item for sale on the marketplace */
    contract = new ethers.Contract(nftmarketaddress, Market.abi, signer)
    let listingPrice = await contract.getListingPrice()
    listingPrice = listingPrice.toString()

    transaction = await contract.createMarketItem(nftaddress, tokenId, price, { value: listingPrice })
    await transaction.wait()
    setShowModalMint(false)
    router.push('/')
  }

  if (showModalIPFS) return (
    <div className="p-4">
      <p>Please wait. Your proposal is uploading to IPFS and we will close this popup automatically when ready ...</p>
      <p>{fileUploadProgress}</p>
    </div>
  )
  if (showModalMint) return (
    <div className="p-4">
      <p>Please wait. Your METAMASK will prompt you for minting NFT, and then again for adding to marketplace.</p>
      <p>We will close this popup automatically when ready.</p>
    </div>
  )
  return (
    <div>
    <div className="p-4">
      <h2 className="text-2xl py-2">Please use the Create Digital Asset button. Your submission will be AI rated.</h2>
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
          placeholder="Asset Name"
          className="mt-8 border rounded p-4"
          onChange={e => updateFormInput({ ...formInput, name: e.target.value })}
        />
        <textarea
          placeholder="Asset Description"
          className="mt-2 border rounded p-4"
          onChange={e => updateFormInput({ ...formInput, description: e.target.value })}
        />
        <input
          placeholder="Licence Fee in MATIC"
          className="mt-2 border rounded p-4"
          onChange={e => updateFormInput({ ...formInput, price: e.target.value })}
        />
        <button className="w-full bg-pink-500 text-white font-bold py-2 px-12 rounded" onClick={createFirebase}>
          Create Digital Asset
        </button>
      </div>
    </div>
    </div>
  )
}
