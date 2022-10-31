import {
    SubstrateBlock,
    SubstrateEvent,
} from "@subql/types";
import { BlockNumber } from "@polkadot/types/interfaces";
import { Compact } from "@polkadot/types";
import BigNumber from "bignumber.js";

import { SlpInfo, TokenStatus, FarmingBalance } from "../types";

export async function handleSlp(block: SubstrateBlock): Promise<void> {
    const blockNumber = (
        block.block.header.number as Compact<BlockNumber>
    ).toBigInt();
    const slpEvents = block.events.filter(
        (e) => e.event.section === "slp"
    ) as unknown as SubstrateEvent[];

    for (let slpEvent of slpEvents) {
        const {
            event: { data, method },
        } = slpEvent;
        const record = new SlpInfo(
            blockNumber.toString() + "-" + slpEvent.idx.toString()
        );

        record.block_height = blockNumber;
        record.block_timestamp = block.timestamp;
        record.method = method.toString();
        record.data = data.toString();

        await record.save();
    }

    const status = await api.query.systemStaking?.tokenStatus({ "Token2": "0" });

    const tokenStatus = JSON.parse(JSON.stringify(status))

    const tokenStatusRecord = new TokenStatus(
        blockNumber.toString()
    );

    tokenStatusRecord.block_height = blockNumber;
    tokenStatusRecord.block_timestamp = block.timestamp;
    tokenStatusRecord.farming_staking_amount = tokenStatus?.farmingStakingAmount ? BigInt(tokenStatus?.farmingStakingAmount) : BigInt(0);
    tokenStatusRecord.system_stakable_amount = tokenStatus?.systemStakableAmount ? BigInt(tokenStatus?.systemStakableAmount) : BigInt(0);
    tokenStatusRecord.system_shadow_amount = tokenStatus?.systemShadowAmount ? BigInt(tokenStatus?.systemShadowAmount) : BigInt(0);


    await tokenStatusRecord.save();

    const poolInfos = await api.query.farming?.poolInfos.entries();
    await Promise.all(
        poolInfos.map(async (item) => {
            const poolId = item[0].toHuman()[0];
            const poolInfo = JSON.parse(JSON.stringify(item[1]))
            const rewardIssuer = poolInfo?.rewardIssuer;
            const rewards = poolInfo?.rewards;
            const tokensProportion = JSON.stringify(Object.keys(poolInfo.tokensProportion)[0])

            await Promise.all(
                Object.keys(rewards).map(async (key, index) => {
                    const token = JSON.stringify(key)
                    let token_free

                    if (token.includes('BNC')) {
                        const nativeBalance = await api.query.system.account(rewardIssuer);
                        token_free = JSON.parse(JSON.stringify(nativeBalance))?.data?.free
                    } else {
                        const tokenBalance = await api.query.tokens.accounts(rewardIssuer, renderToken(token).token);
                        token_free = JSON.parse(JSON.stringify(tokenBalance))?.free
                    }

                    const farmingBalanceRecord = new FarmingBalance(
                        blockNumber.toString() + "-" + poolId.toString() + "-" + index.toString()
                    );
                    const claim_remain = new BigNumber(rewards[key][0])
                        .minus(rewards[key][1])
                        .toNumber()

                    farmingBalanceRecord.block_height = blockNumber;
                    farmingBalanceRecord.block_timestamp = block.timestamp;
                    farmingBalanceRecord.tokens_proportion = tokensProportion
                    farmingBalanceRecord.pool_name = renderToken(tokensProportion).label
                    farmingBalanceRecord.reward_issuer = rewardIssuer;
                    farmingBalanceRecord.pool_token = poolId + '-' + renderToken(tokensProportion).label + '-' + renderToken(token).label;
                    farmingBalanceRecord.pool_id = poolId;
                    farmingBalanceRecord.token = token;
                    farmingBalanceRecord.token_decimals = renderToken(token).decimals;
                    farmingBalanceRecord.token_free = token_free ? BigInt(token_free) : BigInt(0);
                    farmingBalanceRecord.claim_remain = BigInt(claim_remain);
                    farmingBalanceRecord.remain = BigInt(new BigNumber(token_free)
                        .minus(claim_remain)
                        .toNumber());

                    await farmingBalanceRecord.save();
                }))
        }))

}

const renderToken = (key) => {
    switch (true) {
        case key === '"{\\"token2\\":\\"0\\"}"':
            return { label: 'DOT', token: { 'Token2': '0' }, decimals: BigInt('10000000000') }
        case key === '"{\\"token2\\":\\"1\\"}"':
            return { label: 'GLMR', token: { 'Token2': '1' }, decimals: BigInt('1000000000000000000') }
        case key === '"{\\"lpToken\\":[\\"ASG\\",8,\\"ASG\\",9]}"':
            return { label: 'LP vDOT-DOT', token: { 'LPToken': ['ASG', 8, 'ASG', 9] }, decimals: BigInt('10000000000') }
        default:
            return { label: 'ZLK', token: { 'Token': 'ZLK' }, decimals: BigInt('1000000000000000000') }
    }
}
