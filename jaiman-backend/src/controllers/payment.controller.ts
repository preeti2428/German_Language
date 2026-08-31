import { Response } from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import Booking from '../models/Booking';
import { AuthRequest } from '../middleware/authMiddleware';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'secret_placeholder',
});

// ─── POST /api/payments/create-order ──────────────────────────────────────────
export const createOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { bookingId } = req.body;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      res.status(404).json({ message: 'Booking not found.' });
      return;
    }
    if (booking.paymentStatus === 'paid') {
      res.status(400).json({ message: 'Booking is already paid.' });
      return;
    }

    const amountInPaise = (booking.price || 1000) * 100;

    const options = {
      amount: amountInPaise,
      currency: 'INR',
      receipt: `receipt_booking_${booking._id}`,
    };

    const order = await razorpay.orders.create(options);

    booking.paymentOrderId = order.id;
    await booking.save();

    res.json({ orderId: order.id, amount: order.amount, currency: order.currency });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error creating Razorpay order' });
  }
};

// ─── POST /api/payments/verify ──────────────────────────────────────────────
export const verifyPayment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingId } = req.body;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      res.status(404).json({ message: 'Booking not found.' });
      return;
    }

    const secret = process.env.RAZORPAY_KEY_SECRET || 'secret_placeholder';
    const generated_signature = crypto
      .createHmac('sha256', secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (generated_signature === razorpay_signature) {
      // Payment is successful
      booking.paymentStatus = 'paid';
      booking.status = 'confirmed';
      
      // Generate meet link upon successful payment
      const letters = 'abcdefghijklmnopqrstuvwxyz';
      const randStr = (n: number) => Array.from({ length: n }, () => letters[Math.floor(Math.random() * letters.length)]).join('');
      booking.meetLink = `https://meet.google.com/${randStr(3)}-${randStr(4)}-${randStr(3)}`;
      
      await booking.save();
      res.json({ success: true, booking });
    } else {
      // Could mark payment as failed here, but usually frontend alerts user
      booking.paymentStatus = 'failed';
      await booking.save();
      res.status(400).json({ success: false, message: 'Invalid payment signature' });
    }
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error verifying payment' });
  }
};
