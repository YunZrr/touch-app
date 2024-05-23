import React, { useEffect, useMemo, useState } from 'react'
import { LogoIcon } from '../logo'
import data from '@/config/mbti-data.json'
import { useTranslation } from 'react-i18next'
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from '@/components/ui/carousel'
import { BackgroundGradient } from '../ui/background-gradient'
import {
  ConnectButton,
  useCurrentAccount,
  useSignAndExecuteTransactionBlock,
  useSuiClientMutation,
} from '@mysten/dapp-kit'
import { motion } from 'framer-motion'
import { TConductorInstance } from 'react-canvas-confetti/dist/types'
import Realistic from 'react-canvas-confetti/dist/presets/realistic'
import { TransactionBlock } from '@mysten/sui.js/transactions'
import { Link } from 'react-router-dom'
import { ADMIN_CAP, MINT_TO, NFT_INFOS, NFT_OBJ_TYPE } from '@/lib/constants'
import { suiClient, signer } from '@/lib/sui'
import { getEnv } from '@/lib/env'


function PersonalityList() {
  // use memo
  const list = useMemo(() => data.filter((item) => item.level === '1'), [])
  const { t } = useTranslation('translation')
  const account = useCurrentAccount()
  const { mutateAsync: signAndExecuteTransactionBlock } = useSignAndExecuteTransactionBlock()
  const { mutateAsync: waitForTransactionBlock } = useSuiClientMutation('waitForTransactionBlock')
  const [conductor, setConductor] = useState<TConductorInstance>()
  const [claimed, setClaimed] = useState(false)
  const [walletAddr, setWalletAddr] = useState('')

  useEffect(() => {
    if (account) {
      console.log(getEnv())
      setWalletAddr(account.address)
    }
  }, [account])

  const onInit = ({ conductor }: { conductor: TConductorInstance }) => {
    setConductor(conductor)
  }

  const onMint = async () => {
    const txb = new TransactionBlock();

    const nft = NFT_INFOS.filter(item => 
      item.personality == 'Virtuoso' && item.level == '2'
    )
    console.log(nft)
    txb.moveCall({
      arguments: [
        txb.object(ADMIN_CAP),
        txb.pure.string(nft[0].fame),
        txb.pure.string(nft[0].personality),
        txb.pure.u8(Number(nft[0].level)),
        txb.pure.string(nft[0].desc),
        txb.pure.string(nft[0].url.slice(0, nft[0].url.lastIndexOf('/'))),
        txb.pure.address(walletAddr)
      ],
      target: MINT_TO 
    });

    const txRes = await suiClient.signAndExecuteTransactionBlock({
      signer,
      transactionBlock: txb,
    })
    if (txRes) {
      console.log(txRes)
      setClaimed(true)
      conductor?.run({
        speed: 0.3,
      })
      // setImageUrl(nft[0].url)
      let nft_objs = await suiClient.getOwnedObjects({
        owner: walletAddr,
        options: { showType: true, showContent: true },
        filter: {StructType: NFT_OBJ_TYPE}
      })
      console.log(nft_objs.data.map(obj => obj.data?.content))
    }
  }

  return (
    <div className="flex flex-col pb-6 space-y-4">
      <h2 className="px-6 text-xl">Step1: {t('choose-mbti')}</h2>
      <div className="space-y-8">
        <Carousel>
          <CarouselContent>
            {list.map((item, index) => (
              <CarouselItem key={item.personality} className="p-6 pl-10">
                <BackgroundGradient className="h-[268px] rounded-lg space-y-4 p-4 flex flex-col">
                  <div className="flex justify-between">
                    <div className="text-white">{item.personality}</div>
                    <div className="text-white">{index + 1}</div>
                  </div>
                  <div className="flex-1 h-0 px-4">
                    <img src={`/images/personality${item.url}`} alt={item.personality} className="w-full h-full" />
                  </div>
                </BackgroundGradient>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="bg-white left-4" />
          <CarouselNext className="bg-white right-4" />
        </Carousel>

        <h2 className="px-6 text-xl">Step2: {t('claim-nft')}</h2>
        <div className="flex items-center justify-center">
          {account ? (
            <motion.button
              className="w-[302px] p-[3px] relative select-none"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500" />
              <div
                onClick={onMint}
                className="[letter-spacing:0.12rem] px-8 py-2 text-2xl rounded-[6px] font-bold relative group transition duration-200 text-white bg-transparent"
              >
                {t('mint')}
              </div>
            </motion.button>
          ) : (
            <ConnectButton />
          )}

          <Realistic onInit={onInit} />
        </div>

        <h2 className="px-6 text-xl">Step3: {t('get-started')}</h2>
        <div className="flex items-center justify-center">
          <motion.button
            className="w-[302px] p-[3px] relative select-none group"
            disabled={!claimed}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <div className="absolute inset-0 rounded-lg group-disabled:bg-slate-500 group-disabled:[background-image:none] bg-gradient-to-r from-indigo-500 to-purple-500" />
            <div
              onClick={onMint}
              className="[letter-spacing:0.12rem] px-8 py-2 text-2xl rounded-[6px] font-bold relative group transition duration-200 text-white bg-transparent"
            >
              {t('get-started')}
            </div>
          </motion.button>
        </div>
      </div>
    </div>
  )
}

export function Signup() {
  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between px-2 py-3 space-x-3 h-[64px]">
        <div className="flex items-center space-x-3">
          <Link to={'/'}>
            <LogoIcon className="w-8 h-8" />
          </Link>
          <h1 className="text-transparent bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text">Signup</h1>
        </div>
        <ConnectButton />
      </header>
      <main>
        <PersonalityList />
      </main>
    </div>
  )
}
