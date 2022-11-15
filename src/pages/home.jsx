import Web3 from 'web3';
import React, { useEffect, useState, useContext } from "react";
import { Button, Form, Container, Row, Col, Tabs, Tab } from "react-bootstrap";
import { toast } from 'react-toastify'; //toster
import { stakingAddress, stakingABI } from '../components/contracts/StakingContractData';
import { rewardTokenAddress, rewardTokenABI } from '../components/contracts/RewardsTokenContractData';
import { lpTokenAddress, lpTokenABI } from '../components/contracts/LPTokenContractData';

import { LoginContext } from './LoginContext';

function Home(props) {
  const [loginData, setLoginData] = useContext(LoginContext);

  const [stakInfo, setStakInfo] = useState(null);
  const [totalStakeAmount, setTotalStakeAmount] = useState(0);
  const [stakContractBalance, setStakContractBalance] = useState(0);
  const [claimableRewardTillNow, setClaimableRewardTillNow] = useState(0);


  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('chainChanged', () => {
        window.location.reload();
      })
      window.ethereum.on('accountsChanged', function (accounts) {
        // Time to reload your interface with accounts[0]!
        connect();
      });
      connect();
    }
    // fix-the-react-memory-leak-
    return () => {
      props.setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (loginData.isConnected) {
      getStakeInfoData();
      getAllContractVariables();
    }
  }, [loginData]);

  async function connect() {
    let web3;
    let StakingContract, RewardTokenContract, LPTokenContract;
    //connect to web3
    if (typeof window !== 'undefined' && typeof window.web3 !== 'undefined') {
      //we are in the browser and metamask is running
      //ETH test net 3,  // mainnet 1
      // BSC test net 97  //mainnet 56
      web3 = new Web3(window.web3.currentProvider);
      let netId = parseInt(window.ethereum.chainId);
      var networkName = "";
      // console.log(netId);
      switch (netId) {
        case 97:
          networkName = 'BSC'
          console.log('Network is BSC mainnet')
          break
        default:
          toast.error('Please select mainnet first')
          console.error('Please select mainnet first')
          return;
      }
      //set details
      //log network
      // web3.eth.net.getNetworkType().then(console.log);
      let accounts;
      try {
        accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      } catch (error) {
        if (error.code === 4001) {
          console.error("Please allow metamask to connect")
        }
        return;
        // console.log(error)
      }
      // console.log(accounts)
      if (accounts.length < 1) {
        console.error('Please unlock metamask wallet first!')
        return;
      }
      // console.log(accounts[0]);

      StakingContract = new web3.eth.Contract(stakingABI, stakingAddress);
      RewardTokenContract = new web3.eth.Contract(rewardTokenABI, rewardTokenAddress);
      LPTokenContract = new web3.eth.Contract(lpTokenABI, lpTokenAddress);
      setLoginData({
        walletAddress: accounts[0],
        isConnected: true,
        username: "",
        web3: web3,
        role: null,
        StakingContract: StakingContract,
        RewardTokenContract: RewardTokenContract,
        LPTokenContract: LPTokenContract
      });
       console.log(accounts[0], web3, StakingContract, RewardTokenContract, LPTokenContract);
    } else {
      //on the browser or user is not running metamask
      console.error("Metamask wallet not found! Please make sure wallet is installed and running!");
    }
  }

  const getAllContractVariables = async () => {
    props.setLoading(true);
    try {
      var result = await loginData.StakingContract.methods.owner().call({ from: loginData.walletAddress });
      console.log("owner : "+result);

      result = await loginData.StakingContract.methods.paused().call({ from: loginData.walletAddress });
      console.log("paused : "+result);

      result = await loginData.StakingContract.methods.rewardRate().call({ from: loginData.walletAddress });
      console.log("rewardRate : "+result);

      result = await loginData.StakingContract.methods.rewardRateDuration().call({ from: loginData.walletAddress });
      console.log("rewardRateDuration : "+result);

      result = await loginData.StakingContract.methods.stakeFee().call({ from: loginData.walletAddress });
      console.log("stakeFee : "+result);

      result = await loginData.StakingContract.methods.totalStakedAmount().call({ from: loginData.walletAddress });
      console.log("totalStakedAmount : "+result);

      result = await loginData.StakingContract.methods.unstakeFee().call({ from: loginData.walletAddress });
      console.log("unstakeFee : "+result);

    } catch (err) {
      console.log(err);
    }
    props.setLoading(false);
  }


  const getTotalStakeAmount = async () => {
    props.setLoading(true);
    try {
      var result = await loginData.StakingContract.methods.totalStakedAmount().call({ from: loginData.walletAddress });
      console.log("getTotalStakeAmount :" + result);
      setTotalStakeAmount(result);
    } catch (err) {
      console.log(err);
    }
    props.setLoading(false);
  }

  const getStakeInfoData = async () => {
    props.setLoading(true);

    try {
      var result = await loginData.StakingContract.methods.stakeInfos(loginData.walletAddress).call({ from: loginData.walletAddress });
      console.log(result);
      setStakInfo(result);
    } catch (err) {
      console.log(err);
    }

    props.setLoading(false);
  }

  const getStakeContractBalance = async () => {
    props.setLoading(true);

    try {
      var result = await loginData.RewardTokenContract.methods.balanceOf(stakingAddress).call({ from: loginData.walletAddress });
      console.log(result);
      setStakContractBalance(result);
    } catch (err) {
      console.log(err);
    }

    props.setLoading(false);
  }

  const getClaimableRewardTillNow = async () => {
    props.setLoading(true);
    var amount = 0;
    try {
      var result = await loginData.StakingContract.methods.getMyClaimRewardTillNow().call({ from: loginData.walletAddress });
      console.log(result);
      setClaimableRewardTillNow(result);
    } catch (err) {
      // toast.error(err.message);
      console.log(err);
    }

    props.setLoading(false);
  }

  const handleSubmitStak = async (event) => {
    props.setLoading(true);
    event.preventDefault();
    const amount = (convertEthersToWei(event.target.stakingAmount.value)).toString();//convert it with decimal value

    try {
      if (parseInt(amount) > parseInt(await loginData.LPTokenContract.methods.allowance(loginData.walletAddress, stakingAddress).call())) {
        let allowanceHash = await loginData.LPTokenContract.methods.approve(stakingAddress, amount).send({ from: loginData.walletAddress });
        console.log("approve transaction Hash " + JSON.stringify(allowanceHash));
      }
      var result = await loginData.StakingContract.methods.stakeToken(amount).send({ from: loginData.walletAddress });
      console.log(result);

    } catch (err) {
      console.log(err);
    }

    props.setLoading(false);
  }

  const handleSubmitUnstak = async (event) => {
    props.setLoading(true);
    event.preventDefault();

    const amount = (convertEthersToWei(event.target.unstakingAmount.value)).toString();//convert it with decimal value


    try {
      var result = await loginData.StakingContract.methods.unstakeToken(amount).send({ from: loginData.walletAddress });
      console.log(result);

    } catch (err) {
      console.log(err);
    }

    props.setLoading(false);
  }

  const claimRewards = async () => {
    props.setLoading(true);
    try {
      var result = await loginData.StakingContract.methods.claimReward().send({ from: loginData.walletAddress });
      console.log(result);

    } catch (err) {
      // toast.error(err.message);
      console.log(err);
    }
    props.setLoading(false);
  }

  const unstakeAndclaimRewards = async () => {
    props.setLoading(true);

    try {
      var result = await loginData.StakingContract.methods.unstakeAllTokenAndClaimReward().send({ from: loginData.walletAddress });
      console.log(result);

    } catch (err) {
      // toast.error(err.message);
      console.log(err);
    }
    props.setLoading(false);
  }

  const convertWeiToEthers = (_amount) => {
    if (_amount)
      return (_amount / 10 ** 18).toFixed(2);
    return 0;
  }

  const convertEthersToWei = (_amount) => {
    if (_amount)
      return _amount * 10 ** 18;
    return 0;
  }

  return (<>

    <div className="login-wrapper">
      {loginData.isConnected ?
        <Container>
          <div className='login-page'>
            <div className="home-heading">
              <h2> Contract Calls</h2>
            </div>

            <Row>
              <Col md={6}>
                <span onClick={() => getTotalStakeAmount()}>Total Stake Amount (LP token):  {convertWeiToEthers(totalStakeAmount)} <button >refresh</button></span>
              </Col>
              <Col md={6}>
                <span onClick={() => getStakeContractBalance()}> Contract Reward (PAW token) Balance:  {convertWeiToEthers(stakContractBalance)} <button >refresh</button></span>
              </Col>
            </Row>
            <br />
            <Row>
              <Col md={6}>
                <span onClick={() => getStakeInfoData()}>You have {convertWeiToEthers(stakInfo?.amount)} on stake <button >refresh</button></span>
              </Col>
              <Col md={6}>
                <span onClick={() => getStakeInfoData()}>Claim Reward (PAW Token):  {convertWeiToEthers(stakInfo?.unclaimedRewards)} <button >refresh</button></span>
              </Col>
            </Row>

            <Row>
              <Form onSubmit={handleSubmitStak}>
                <Form.Group className="mb-3 input-form" controlId="formStakingAmount">
                  <Form.Label>Stake LP Token<span className="color-red">*</span></Form.Label>
                  <Form.Control className="input-design" type="number" id="stakingAmount" required />
                </Form.Group>

                <div className='btn-row'>
                  <Button variant="primary" type="submit" disabled={props.loading}> Stake </Button>
                </div>
              </Form>
            </Row>

            <Row>
              <Form onSubmit={handleSubmitUnstak}>
                <Form.Group className="mb-3 input-form" controlId="formUnstakingAmount">
                  <Form.Label>Unstake LP Token<span className="color-red">*</span></Form.Label>
                  <Form.Control className="input-design" type="number" id="unstakingAmount" required />
                </Form.Group>

                <div className='btn-row'>
                  <Button variant="primary" type="submit" disabled={props.loading}> Unstake </Button>
                </div>

              </Form>
            </Row>
            <br />
            <Row>
              <span onClick={() => getClaimableRewardTillNow()}> Claimable reward(PAW token) amount till now:  {convertWeiToEthers(claimableRewardTillNow)} <button >refresh</button></span>
            </Row>
            <br /><br />
            <Row>
              <Button onClick={() => claimRewards()}> Claim Reward (PAW token) </Button>
            </Row>
            <br /><br />
            <Row>
              <Button onClick={() => unstakeAndclaimRewards()}> Unstake All (LP token) and Claim Reward (PAW token) </Button>
            </Row>

          </div>
        </Container>
        : <div style={{ textAlign: "center" }}>
          <Button onClick={() => connect()}>Connect Wallet</Button>
        </div>}
    </div>
  </>
  )
}
export default Home;