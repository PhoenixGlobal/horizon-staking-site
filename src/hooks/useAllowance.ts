import { useCallback, useEffect, useMemo } from "react";
import { useAtom } from "jotai";
import { BigNumber } from "ethers";
import { Erc20 } from "@abis/types";
import { tokenAllowanceAtomFamily } from "@atoms/balance";
import { Token } from "@utils/constants";
import { usePHB, useHZN } from "./useContract";
import useWallet from "./useWallet";

export const useTokenAllowance = (token: TokenEnum, spenderAddress: string) => {
  const { account } = useWallet();

  const [allowance, setAllowance] = useAtom(tokenAllowanceAtomFamily(token));

  const phbContract = usePHB(true);
  const hznContract = useHZN(true);

  const tokenContract: Erc20 | null = useMemo(() => {
    switch (token) {
      case Token.HZN:
        return hznContract as Erc20;
      case Token.PHB:
        return phbContract as Erc20;
      default:
        break;
    }
    return null;
  }, [token, phbContract, hznContract]);

  const fetchAllowance = useCallback(async () => {
    if (account && tokenContract) {
      const allowance = await tokenContract.allowance(account, spenderAddress);
      console.log("allowance", token, allowance.toString());
      setAllowance(allowance);
    }
  }, [account, tokenContract, setAllowance, spenderAddress, token]);

  const checkApprove = useCallback(
    async (amount: BigNumber) => {
      if (amount.lte(allowance)) {
        console.log("ignore approve", allowance.toString());
        return;
      }

      if (account && tokenContract) {
        const total = await tokenContract.totalSupply();
        console.log(total.toString());
        const tx = await tokenContract.approve(spenderAddress, total);
        console.log("approve", tx);
      }
    },
    [allowance, account, tokenContract, spenderAddress]
  );

  useEffect(() => {
    fetchAllowance();
  }, [fetchAllowance]);

  return {
    allowance,
    checkApprove,
  };
};