import Razorpay from 'razorpay';
import dotenv from 'dotenv';
dotenv.config();

const key_id = (process.env.RAZORPAY_KEY_ID || 'rzp_test_TmAPu7Flpk7sJ4').trim();
const key_secret = (process.env.RAZORPAY_KEY_SECRET || 'TLjk1r96J8nzVuwdzAcg9MIO').trim();

console.log('Testing Razorpay with Key ID:', JSON.stringify(key_id));
console.log('Key Secret:', JSON.stringify(key_secret));

const rzp = new Razorpay({ key_id, key_secret });

async function run() {
  try {
    const payments = await rzp.payments.all({ count: 1 });
    console.log('✅ Payments fetched:', payments);
  } catch (err) {
    console.error('❌ Razorpay Error Status:', err.statusCode);
    console.error('❌ Razorpay Error Object:', JSON.stringify(err, null, 2));
  }
}

run();
