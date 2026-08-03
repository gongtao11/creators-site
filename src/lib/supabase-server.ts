import { createClient } from "@supabase/supabase-js";

// 鏈嶅姟绔鎴风 (浣跨敤 service_role key锛屼粎鐢ㄤ簬 API Routes / Server Components)
// 杩欎釜鏂囦欢缁濅笉鑳戒粠瀹㈡埛绔粍浠跺鍏ワ紒
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
