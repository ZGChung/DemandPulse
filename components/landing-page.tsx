import Link from "next/link";
import { FaGithub, FaChartLine, FaEye, FaUsers, FaLock, FaRocket } from "react-icons/fa";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <span className="text-2xl font-bold text-gray-900">DemandPulse</span>
              <span className="ml-2 px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                Beta
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/trends" className="text-gray-700 hover:text-blue-600 font-medium">
                Trends
              </Link>
              <Link href="/auth/signin" className="text-gray-700 hover:text-gray-900 font-medium">
                Sign in
              </Link>
              <Link
                href="/auth/signin"
                className="px-4 py-2 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 transition-colors"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              See what developers are building <span className="text-blue-600">in real-time</span>
            </h1>
            <p className="text-xl text-gray-600 mb-10 max-w-3xl mx-auto">
              DemandPulse aggregates developer needs from AI coding workflows, giving you a live
              signal of unmet market opportunities and emerging trends.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/auth/signin"
                className="px-8 py-4 bg-gray-900 text-white font-semibold rounded-lg hover:bg-gray-800 transition-colors text-lg flex items-center justify-center"
              >
                <FaRocket className="mr-2" />
                Start Exploring Trends
              </Link>
              <Link
                href="/trends"
                className="px-8 py-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors text-lg flex items-center justify-center"
              >
                <FaEye className="mr-2" />
                View Public Trends
              </Link>
              <a
                href="#how-it-works"
                className="px-8 py-4 bg-white text-gray-900 font-semibold rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors text-lg"
              >
                How It Works
              </a>
            </div>
          </div>

          {/* Social Proof */}
          <div className="mt-20 flex flex-wrap justify-center items-center gap-8 text-gray-600">
            <div className="flex items-center">
              <FaUsers className="text-blue-500 mr-2" />
              <span className="font-medium">500+ developers tracking trends</span>
            </div>
            <div className="flex items-center">
              <FaChartLine className="text-green-500 mr-2" />
              <span className="font-medium">10,000+ requirements analyzed</span>
            </div>
            <div className="flex items-center">
              <FaLock className="text-purple-500 mr-2" />
              <span className="font-medium">Privacy-first design</span>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">How DemandPulse Works</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Connect your Claude Code workflow and start contributing to the developer intelligence
              network.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-6">
                <span className="text-2xl font-bold text-blue-600">1</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Install Plugin</h3>
              <p className="text-gray-600 mb-6">
                Add the DemandPulse plugin to your Claude Code setup with a simple installation.
              </p>
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-sm font-medium">
                <FaGithub className="mr-2" />
                2-minute setup
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-6">
                <span className="text-2xl font-bold text-green-600">2</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Work with Claude</h3>
              <p className="text-gray-600 mb-6">
                As you use Claude Code for development, our plugin detects requirements and asks for
                your consent to share.
              </p>
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-green-50 text-green-700 text-sm font-medium">
                <FaEye className="mr-2" />
                Opt-in sharing
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-6">
                <span className="text-2xl font-bold text-purple-600">3</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Discover Insights</h3>
              <p className="text-gray-600 mb-6">
                View real-time trends, see what others are building, and identify market
                opportunities.
              </p>
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-sm font-medium">
                <FaChartLine className="mr-2" />
                Live dashboard
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Join DemandPulse?</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Be part of the future of developer intelligence.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="p-6">
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center mb-4">
                  {benefit.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">{benefit.title}</h3>
                <p className="text-gray-600">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">
            Ready to see what developers are building?
          </h2>
          <p className="text-gray-300 mb-10 text-lg">
            Join hundreds of developers already contributing to the demand intelligence network.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/signin"
              className="px-8 py-4 bg-white text-gray-900 font-semibold rounded-lg hover:bg-gray-100 transition-colors text-lg"
            >
              Get Started Free
            </Link>
            <a
              href="#"
              className="px-8 py-4 bg-transparent text-white font-semibold rounded-lg border border-gray-600 hover:bg-gray-800 transition-colors text-lg"
            >
              Learn More
            </a>
          </div>
          <p className="mt-8 text-gray-400 text-sm">
            No credit card required • Privacy-first • Open to all developers
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <span className="text-xl font-bold text-gray-900">DemandPulse</span>
              <p className="text-gray-600 text-sm mt-1">
                Real-time demand radar for AI-native developers
              </p>
            </div>
            <div className="flex items-center space-x-6">
              <a href="#" className="text-gray-600 hover:text-gray-900 text-sm">
                Privacy Policy
              </a>
              <a href="#" className="text-gray-600 hover:text-gray-900 text-sm">
                Terms of Service
              </a>
              <a href="#" className="text-gray-600 hover:text-gray-900 text-sm">
                GitHub
              </a>
              <a href="#" className="text-gray-600 hover:text-gray-900 text-sm">
                Contact
              </a>
            </div>
          </div>
          <div className="mt-8 text-center text-gray-500 text-sm">
            © {new Date().getFullYear()} DemandPulse. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

// Benefits data
const benefits = [
  {
    icon: <FaChartLine className="text-blue-500" size={20} />,
    title: "Real-time Market Intelligence",
    description: "See emerging trends and technologies before they hit mainstream.",
  },
  {
    icon: <FaEye className="text-green-500" size={20} />,
    title: "Anonymous Contribution",
    description: "Share your requirements anonymously while still seeing collective insights.",
  },
  {
    icon: <FaLock className="text-purple-500" size={20} />,
    title: "Privacy First",
    description: "Full control over what you share. Opt-in consent for every requirement.",
  },
  {
    icon: <FaUsers className="text-orange-500" size={20} />,
    title: "Community Insights",
    description: "Learn from thousands of developers about tools, frameworks, and challenges.",
  },
  {
    icon: <FaRocket className="text-red-500" size={20} />,
    title: "Early Adopter Advantage",
    description: "Spot opportunities before competitors and build what developers actually need.",
  },
  {
    icon: <FaGithub className="text-gray-500" size={20} />,
    title: "GitHub Integration",
    description: "Seamless setup with your existing GitHub account and Claude Code workflow.",
  },
];
