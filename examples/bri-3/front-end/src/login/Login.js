import axios from 'axios';
import { SRI_BACKEND } from '../constants';

const handleLogin = async () => {
  // TODO: handle situations like account switch in metamask
  if (window.ethereum) {
    window.ethereum.enable();
    const accounts = await window.ethereum.send('eth_requestAccounts');
    const nonceDto = {
      publicKey: accounts.result[0]
    };
    const nonce = await axios.post(`${SRI_BACKEND}/auth/nonce`, nonceDto);
    const signature = await window.ethereum.request({
      method: 'personal_sign',
      params: [nonce.data, accounts.result[0]],
    });

    const loginDto = {
      message: nonce.data,
      signature,
      publicKey: accounts.result[0],
    };

    const tokenRequest = await axios.post(`${SRI_BACKEND}/auth/login`, loginDto);

    // TODO: add toast library and show success/failure login with error messages
    // TODO: add logged in user details on UI
    if (tokenRequest?.data?.access_token) {
      console.log(tokenRequest.data.access_token);
    } else {
      console.log('No token');
    }
  } else {
    throw new Error('No MM found. Please install Metamask');
  }
};

export default function Login() {
  return <button onClick={handleLogin}>Login</button>;
}
