import { Layout } from "@/components/layout/Layout";
import { Phone, Mail, MapPin, MessageCircle, Clock, Facebook } from "lucide-react";
import { Button } from "@/components/ui/button";
const Contact = () => {
  const whatsappLink = "https://wa.me/8801880545357";
  return <Layout>
      <div className="bg-background min-h-screen">
        {/* Header */}
        <div className="bg-secondary py-8">
          <div className="container mx-auto px-4">
            <h1 className="font-display text-3xl md:text-4xl font-bold text-primary-foreground text-center">
              Contact <span className="text-gold">Us</span>
            </h1>
            <p className="text-primary-foreground/80 text-center mt-2">
              We're here to help you
            </p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-12">
          <div className="max-w-2xl mx-auto">
            {/* WhatsApp CTA */}
            <div className="bg-card rounded-lg p-6 md:p-8 shadow-sm mb-8 text-center">
              <div className="w-16 h-16 rounded-full bg-gold-soft flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="h-8 w-8 text-primary" />
              </div>
              <h2 className="font-display text-2xl font-bold text-foreground mb-2">
                Quick Support via WhatsApp
              </h2>
              <p className="text-muted mb-6">
                Get instant responses for orders, queries, or custom requests
              </p>
              <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                <Button size="lg" className="bg-primary text-primary-foreground hover:bg-gold hover:text-gold-foreground">
                  <MessageCircle className="h-5 w-5 mr-2" />
                  Chat on WhatsApp
                </Button>
              </a>
            </div>

            {/* Contact Info Cards */}
            <div className="grid md:grid-cols-2 gap-4 mb-8">
              <div className="bg-card rounded-lg p-6 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-gold-soft flex items-center justify-center flex-shrink-0">
                    <Phone className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">Phone</h3>
                    <a href="tel:+8801880545357" className="text-muted hover:text-gold transition-colors">
                      +880 1880-545357
                    </a>
                  </div>
                </div>
              </div>

              <div className="bg-card rounded-lg p-6 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-gold-soft flex items-center justify-center flex-shrink-0">
                    <Mail className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">Email</h3>
                    <a href="mailto:unitycollectionbd@gmail.com" className="text-muted hover:text-gold transition-colors">
                      unitycollectionbd@gmail.com
                    </a>
                  </div>
                </div>
              </div>

              <div className="bg-card rounded-lg p-6 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-gold-soft flex items-center justify-center flex-shrink-0">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">Location</h3>
                    <p className="text-muted">Rajshahi, Bangladesh</p>
                  </div>
                </div>
              </div>

              <div className="bg-card rounded-lg p-6 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-gold-soft flex items-center justify-center flex-shrink-0">
                    <Clock className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">Hours</h3>
                    <p className="text-muted">Sat-Thu: 10AM - 9PM</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Social Links */}
            <div className="bg-card rounded-lg p-6 shadow-sm text-center">
              <h3 className="font-display text-lg font-semibold text-foreground mb-4">Follow Us</h3>
              <div className="flex justify-center gap-4">
                <a href="https://www.facebook.com/UnityCollectionBd" target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-full bg-primary flex items-center justify-center hover:bg-gold transition-colors" aria-label="Facebook">
                  <Facebook className="h-6 w-6 text-primary-foreground" />
                </a>
              </div>
            </div>

            {/* Owner Info */}
            <div className="mt-8 text-center text-sm text-muted">
              <p>Owner: <span className="text-foreground">Ibn E Habib</span></p>
            </div>
          </div>
        </div>

        {/* Website Credit */}
        <div className="bg-secondary py-4">
          <div className="container mx-auto px-4 text-center">
            
          </div>
        </div>
      </div>
    </Layout>;
};
export default Contact;