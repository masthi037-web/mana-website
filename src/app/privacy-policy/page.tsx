export default function PrivacyPolicy() {
    return (
        <div className="max-w-4xl mx-auto py-12 px-6">
            <h1 className="text-3xl font-bold mb-8 font-headline">Privacy Policy</h1>
            <div className="prose prose-stone dark:prose-invert max-w-none space-y-6 text-muted-foreground">
                <p>Last updated: {new Date().toLocaleDateString()}</p>

                <p>
                    At ManaBuy, accessible from our website and mobile application, one of our main priorities is the privacy of our visitors.
                    This Privacy Policy document contains types of information that is collected and recorded by ManaBuy and how we use it.
                </p>

                <h2 className="text-xl font-bold text-foreground">Information We Collect</h2>
                <p>
                    We collect information that you provide directly to us when you register for an account, make a purchase,
                    sign up for our newsletter, or communicate with us. This may include your name, email address, phone number,
                    shipping address, and payment information.
                </p>

                <h2 className="text-xl font-bold text-foreground">How We Use Your Information</h2>
                <p>
                    We use the information we collect in various ways, including to:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                    <li>Provide, operate, and maintain our website/app</li>
                    <li>Improve, personalize, and expand our website/app</li>
                    <li>Understand and analyze how you use our website/app</li>
                    <li>Develop new products, services, features, and functionality</li>
                    <li>Process your transactions and manage your orders</li>
                    <li>Communicate with you, either directly or through one of our partners, including for customer service, to provide you with updates and other information relating to the website/app, and for marketing and promotional purposes</li>
                    <li>Send you emails</li>
                    <li>Find and prevent fraud</li>
                </ul>

                <h2 className="text-xl font-bold text-foreground">Log Files</h2>
                <p>
                    ManaBuy follows a standard procedure of using log files. These files log visitors when they visit websites.
                    All hosting companies do this and a part of hosting services' analytics. The information collected by log files include
                    internet protocol (IP) addresses, browser type, Internet Service Provider (ISP), date and time stamp, referring/exit pages,
                    and possibly the number of clicks. These are not linked to any information that is personally identifiable.
                </p>

                <h2 className="text-xl font-bold text-foreground">Cookies and Web Beacons</h2>
                <p>
                    Like any other website, ManaBuy uses 'cookies'. These cookies are used to store information including visitors' preferences,
                    and the pages on the website that the visitor accessed or visited. The information is used to optimize the users' experience
                    by customizing our web page content based on visitors' browser type and/or other information.
                </p>

                <h2 className="text-xl font-bold text-foreground">Third Party Privacy Policies</h2>
                <p>
                    ManaBuy's Privacy Policy does not apply to other advertisers or websites. Thus, we are advising you to consult the respective
                    Privacy Policies of these third-party ad servers for more detailed information. It may include their practices and instructions
                    about how to opt-out of certain options.
                </p>

                <h2 className="text-xl font-bold text-foreground">Consent</h2>
                <p>
                    By using our website/app, you hereby consent to our Privacy Policy and agree to its terms.
                </p>
            </div>
        </div>
    );
}
