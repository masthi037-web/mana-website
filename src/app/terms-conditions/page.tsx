export default function TermsAndConditions() {
    return (
        <div className="max-w-4xl mx-auto py-12 px-6">
            <h1 className="text-3xl font-bold mb-8 font-headline">Terms and Conditions</h1>
            <div className="prose prose-stone dark:prose-invert max-w-none space-y-6 text-muted-foreground">
                <p>Last updated: {new Date().toLocaleDateString()}</p>

                <p>
                    Welcome to ManaBuy! These terms and conditions outline the rules and regulations for the use of ManaBuy's Website and App.
                </p>

                <h2 className="text-xl font-bold text-foreground">1. Introduction</h2>
                <p>
                    By accessing this website we assume you accept these terms and conditions. Do not continue to use ManaBuy if you do not agree
                    to take all of the terms and conditions stated on this page.
                </p>

                <h2 className="text-xl font-bold text-foreground">2. License</h2>
                <p>
                    Unless otherwise stated, ManaBuy and/or its licensors own the intellectual property rights for all material on ManaBuy.
                    All intellectual property rights are reserved. You may access this from ManaBuy for your own personal use subjected to restrictions set in these terms and conditions.
                </p>

                <h2 className="text-xl font-bold text-foreground">3. User Accounts</h2>
                <p>
                    If you create an account on our website, you are responsible for maintaining the security of your account and you are fully responsible
                    for all activities that occur under the account and any other actions taken in connection with it. We may, but have no obligation to,
                    monitor and review new accounts before you may sign in and start using the Service.
                </p>

                <h2 className="text-xl font-bold text-foreground">4. Product Descriptions</h2>
                <p>
                    We attempt to be as accurate as possible. However, ManaBuy does not warrant that product descriptions or other content of this site
                    is accurate, complete, reliable, current, or error-free. If a product offered by ManaBuy itself is not as described, your sole remedy
                    is to return it in unused condition.
                </p>

                <h2 className="text-xl font-bold text-foreground">5. Pricing</h2>
                <p>
                    All prices are subject to change without notice. We reserve the right to modify or discontinue the Service (or any part or content thereof)
                    at any time without notice. We shall not be liable to you or to any third-party for any modification, price change, suspension or discontinuance of the Service.
                </p>

                <h2 className="text-xl font-bold text-foreground">6. Limitation of Liability</h2>
                <p>
                    In no event shall ManaBuy, nor any of its officers, directors and employees, be held liable for anything arising out of or in any way connected
                    with your use of this Website whether such liability is under contract. ManaBuy, including its officers, directors and employees shall not be held
                    liable for any indirect, consequential or special liability arising out of or in any way related to your use of this Website.
                </p>

                <h2 className="text-xl font-bold text-foreground">7. Governing Law</h2>
                <p>
                    These Terms shall be governed and construed in accordance with the laws of India, without regard to its conflict of law provisions.
                </p>
            </div>
        </div>
    );
}
