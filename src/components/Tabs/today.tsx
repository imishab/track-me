import React from 'react'
import Header from '../layout/Header'

export default function Today() {
    return (
        <>
            <Header height='h-22'>
                <div className='flex items-center justify-between w-full'>
                    <div className="flex flex-col">
                        <p className="text-md font-semibold text-violet-500">Friday</p>
                        <p className="text-xl font-bold ">{new Date().toDateString()}</p>
                    </div>

                    <div className='flex flex-col items-center '>
                        <h1 className='text-xl font-black text-violet-500'>20%</h1>
                        <p className='text-xs  text-gray-500'>Completed</p>
                    </div>
                </div>
            </Header>

            <main className="flex-1 overflow-y-auto pt-20 pb-24">
                <div>Today</div>
            </main>
        </>
    )
}