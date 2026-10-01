// Budget Partner settings. Edit this file to switch on cloud accounts and the AI assistant.
//
// Leave supabaseUrl and supabaseAnonKey empty and accounts live on this device only
// (password-protected and encrypted). Fill them in, after running budget/supabase/schema.sql
// in your Supabase project, and accounts sync across every device you sign in on.
// See budget/README.md for the step-by-step.
export const CONFIG = {
  appName: "Budget Partner",
  supabaseUrl: "https://niousoenssyhynyigyap.supabase.co",
  supabaseAnonKey: "sb_publishable_BnNsBnSRpU77S-S5_DFklQ_0kd_Y1C7",
  // Name of the Supabase Edge Function that answers "Ask AI" questions with
  // Claude and web search. Needs cloud accounts (above) and the function deployed.
  aiFunction: "budget-ai",
  aiEnabled: false
};
