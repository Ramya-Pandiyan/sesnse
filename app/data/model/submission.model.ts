export interface Submission {
  id: string;
  insuredName: string;
  receivedDate: string;
  status: 'new' | 'in-review' | 'completed';
  priority: 'low' | 'medium' | 'high';
  category: 'due-today' | 'needs-review' | 'watchlist';
  claimId?: string;
  market?: string;
  homeState?: string;
  dateOfLoss?: string;
  catNumber?: string;
  lossCause?: string;
}

export interface SubmissionDetail {
  id: string;
  insuredName: string;
  claimId: string;
  market: string;
  homeState: string;
  dateOfLoss: string;
  catNumber: string;
  lossCause: string;
  emailSummary: string;
  insuredOperations: InsuredOperations;
  lossExperience: LossExperience;
  appetiteCheck: AppetiteCheck;
  missingInformation: string[];
}

export interface InsuredOperations {
  businessType: string;
  yearsInOperation: number;
  numberOfEmployees: number;
  annualRevenue: string;
  locations: Location[];
}

export interface Location {
  address: string;
  type: string;
  squareFootage: number;
}

export interface LossExperience {
  totalClaims: number;
  totalIncurred: number;
  yearlyData: YearlyLossData[];
}

export interface YearlyLossData {
  year: number;
  claims: number;
  incurred: number;
}

export interface AppetiteCheck {
  overall: 'excellent' | 'good' | 'fair' | 'poor';
  factors: AppetiteFactor[];
}

export interface AppetiteFactor {
  name: string;
  status: 'positive' | 'neutral' | 'negative';
  description: string;
}

export interface ChatMessage {
  id: string;
  type: 'bot' | 'user';
  content: string;
  timestamp: Date;
  hasAction?: boolean;
  actionText?: string;
  actionType?: string;
}

export interface EmailDraft {
  to: string;
  subject: string;
  body: string;
  submissionId: string;
}