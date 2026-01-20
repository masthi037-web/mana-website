export default function CancellationRefund() {
    return (
        <div className="max-w-4xl mx-auto py-12 px-6">
            <h1 className="text-3xl font-bold mb-8 font-headline">Cancellation and Refund Policy</h1>
            <div className="prose prose-stone dark:prose-invert max-w-none space-y-6 text-muted-foreground">
                <p>Last updated: {new Date().toLocaleDateString()}</p>

                <h2 className="text-xl font-bold text-foreground">Cancellation Policy</h2>
                <p>
                    You may cancel your order within 24 hours of placing it, provided that the order has not yet been dispatched.
                    To cancel your order, please contact our customer support team immediately with your order details.
                    If the order has already been dispatched, it cannot be cancelled, but you may be eligible to return it under our Return Policy.
                </p>

                <h2 className="text-xl font-bold text-foreground">Refund Policy</h2>
                <p>
                    We strive to ensure you are satisfied with your purchase. However, if you receive a damaged or incorrect item, you may be eligible for a refund or replacement.
                </p>
                <ul className="list-disc pl-6 space-y-2">
                    <li>
                        <strong>Eligibility:</strong> Refund requests must be made within 7 days of delivery. The item must be unused, in its original packaging, and in the same condition that you received it.
                    </li>
                    <li>
                        <strong>Process:</strong> To initiate a refund, please contact us with your order ID and photos of the issue. Once your return is received and inspected, we will notify you of the approval or rejection of your refund.
                    </li>
                    <li>
                        <strong>Timeline:</strong> If approved, your refund will be processed, and a credit will automatically be applied to your original method of payment within 5-7 business days.
                    </li>
                </ul>

                <h2 className="text-xl font-bold text-foreground">Late or Missing Refunds</h2>
                <p>
                    If you haven’t received a refund yet, first check your bank account again. Then contact your credit card company, it may take some time before your refund is officially posted.
                    Next, contact your bank. There is often some processing time before a refund is posted.
                    If you’ve done all of this and you still have not received your refund yet, please contact us.
                </p>
            </div>
        </div>
    );
}
