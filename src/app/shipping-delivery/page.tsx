export default function ShippingDelivery() {
    return (
        <div className="max-w-4xl mx-auto py-12 px-6">
            <h1 className="text-3xl font-bold mb-8 font-headline">Shipping and Delivery Policy</h1>
            <div className="prose prose-stone dark:prose-invert max-w-none space-y-6 text-muted-foreground">
                <p>Last updated: {new Date().toLocaleDateString()}</p>

                <h2 className="text-xl font-bold text-foreground">Shipping Policy</h2>
                <p>
                    ManaBuy is committed to delivering your orders accurately, in good condition, and always on time.
                    We partner with reputed courier agencies to ensure safe and timely delivery.
                </p>

                <h2 className="text-xl font-bold text-foreground">Shipping Charges</h2>
                <p>
                    Shipping charges may vary based on your location and the total value of your order.
                    Specific shipping charges will be displayed at the time of checkout.
                    We may offer free shipping for orders above a certain value, which will also be clearly indicated on the website.
                </p>

                <h2 className="text-xl font-bold text-foreground">Delivery Timeline</h2>
                <p>
                    We aim to dispatch all orders within 1-2 business days of order confirmation.
                    However, depending on your location, the delivery may take 3-7 business days from the date of dispatch.
                </p>
                <ul className="list-disc pl-6 space-y-2">
                    <li><strong>Metro Cities:</strong> 2-4 business days</li>
                    <li><strong>Rest of India:</strong> 4-7 business days</li>
                </ul>
                <p>
                    Please note that delivery times are estimates and may be affected by unforeseen circumstances such as weather conditions,
                    strikes, or public holidays.
                </p>

                <h2 className="text-xl font-bold text-foreground">Order Tracking</h2>
                <p>
                    Once your order is dispatched, you will receive a tracking number via email/SMS.
                    You can use this tracking number to track the status of your shipment on our courier partner's website.
                </p>

                <h2 className="text-xl font-bold text-foreground">International Shipping</h2>
                <p>
                    Currently, we do not ship outside of India. We are working on expanding our services and will update this policy once we begin international shipping.
                </p>
            </div>
        </div>
    );
}
