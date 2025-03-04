// Copyright (c) Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

import { Check12, X12 } from '@mysten/icons';
import { Ed25519PublicKey, type SuiAddress } from '@mysten/sui.js';
import { useRef, useState } from 'react';
import toast from 'react-hot-toast';

import { useSuiLedgerClient } from '../../ledger/SuiLedgerClientProvider';
import {
    getLedgerConnectionErrorMessage,
    getSuiApplicationErrorMessage,
} from '_src/ui/app/helpers/errorMessages';
import { Link } from '_src/ui/app/shared/Link';
import { Text } from '_src/ui/app/shared/text';

export type VerifyLedgerConnectionLinkProps = {
    accountAddress: SuiAddress;
    derivationPath: string;
};

enum VerificationStatus {
    UNKNOWN = 'UNKNOWN',
    VERIFIED = 'VERIFIED',
    NOT_VERIFIED = 'NOT_VERIFIED',
}

const resetVerificationStatusTimeout = 5000;

export function VerifyLedgerConnectionStatus({
    accountAddress,
    derivationPath,
}: VerifyLedgerConnectionLinkProps) {
    const { connectToLedger } = useSuiLedgerClient();
    const [verificationStatus, setVerificationStatus] = useState(
        VerificationStatus.UNKNOWN
    );
    const timeoutIdRef = useRef<number>();

    switch (verificationStatus) {
        case VerificationStatus.UNKNOWN:
            return (
                <Link
                    text="Verify Ledger connection"
                    onClick={async () => {
                        try {
                            const suiLedgerClient = await connectToLedger();
                            const publicKeyResult =
                                await suiLedgerClient.getPublicKey(
                                    derivationPath,
                                    true
                                );
                            const publicKey = new Ed25519PublicKey(
                                publicKeyResult.publicKey
                            );
                            const suiAddress = publicKey.toSuiAddress();

                            setVerificationStatus(
                                accountAddress === suiAddress
                                    ? VerificationStatus.VERIFIED
                                    : VerificationStatus.NOT_VERIFIED
                            );

                            timeoutIdRef.current = window.setTimeout(() => {
                                setVerificationStatus(
                                    VerificationStatus.UNKNOWN
                                );
                            }, resetVerificationStatusTimeout);
                        } catch (error) {
                            const errorMessage =
                                getLedgerConnectionErrorMessage(error) ||
                                getSuiApplicationErrorMessage(error) ||
                                'Something went wrong';
                            toast.error(errorMessage);
                        }
                    }}
                    color="heroDark"
                    weight="medium"
                />
            );
        case VerificationStatus.NOT_VERIFIED:
            return (
                <div className="flex items-center gap-1">
                    <X12 className="text-issue-dark" />
                    <Text variant="bodySmall" color="issue-dark">
                        Ledger is not connected
                    </Text>
                </div>
            );
        case VerificationStatus.VERIFIED:
            return (
                <div className="flex items-center gap-1">
                    <Check12 className="text-success-dark" />
                    <Text variant="bodySmall" color="success-dark">
                        Ledger is connected
                    </Text>
                </div>
            );
        default:
            throw new Error(
                `Encountered unknown verification status ${verificationStatus}`
            );
    }
}
