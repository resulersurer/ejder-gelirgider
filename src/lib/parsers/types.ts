export type ParsedTransaction = {
  bank: string;
  transactionType: "INCOME" | "EXPENSE" | "TRANSFER_IN" | "TRANSFER_OUT" | "EFT_IN" | "EFT_OUT" | "FAST_IN" | "FAST_OUT" | "SWIFT_IN" | "SWIFT_OUT" | "CREDIT_CARD" | "BANK_FEE" | "REFUND" | "OTHER";
  direction: "IN" | "OUT";
  amount: number;
  currency: string;
  transactionDate: Date;
  sender?: string;
  receiver?: string;
  description?: string;
  referenceNumber?: string;
  confidenceScore: number;
};

export type MailForParsing = { subject: string; sender: string; text: string; date: Date };
export type BankParser = (mail: MailForParsing) => ParsedTransaction | null;