import React, {useState, createContext} from 'react';
import { useEffect } from 'react';

export const LoginContext = createContext();

export const LoginProvider= props =>{
    //import hooks for object
    const [loginData, setLoginData] =  useState({
        walletAddress:"",
        isConnected:false,
        web3:null,
        StakingContract:null,
        rewardTokenContract:null,
        LPTokenContract:null
    })
    

    return(
        <LoginContext.Provider value={[loginData,setLoginData]}>
            {props.children}
        </LoginContext.Provider>
    )

}