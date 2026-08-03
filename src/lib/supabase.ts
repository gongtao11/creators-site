import { createClient } from "@supabase/supabase-js";

// 娴忚鍣ㄧ瀹㈡埛绔?(浠呬娇鐢?NEXT_PUBLIC_ 鍙橀噺锛屽彲鍦ㄥ鎴风瀹夊叏浣跨敤)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
