import '../styles/globals.css'
import '../styles/spinner.css'
import '../styles/album.css'

import "../styles/assets/dist/css/bootstrap.min.css"
import Link from 'next/link'

function Marketplace({ Component, pageProps }) {
  return (
    <div>
      <nav className="border-b p-6">
        <p className="text-4xl font-bold">Metaverse Job Applicants</p>
        <div className="flex mt-4">
          <Link href="/">
            <a className="mr-4 text-pink-500">
              Public Home
            </a>
          </Link>
          <Link href="/create-item">
            <a className="mr-6 text-pink-500">
              Submit Digital Asset
            </a>
          </Link>
          <Link href="/profile">
            <a className="mr-6 text-pink-500">
              Applicant Profile
            </a>
          </Link>
          <Link href="/search-applicant">
            <a className="mr-6 text-pink-500">
              Applicant Search
            </a>
          </Link>
        </div>
      </nav>
      <Component {...pageProps} />
    </div>
  )
}

export default Marketplace
