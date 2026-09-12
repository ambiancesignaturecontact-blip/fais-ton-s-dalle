"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import {
  X,
  Minus,
  Plus,
  ShoppingBag,
  Truck,
  Store,
  Trash2,
  CreditCard,
  MessageCircle,
  MapPin,
  User,
  Sparkles,
  Package,
} from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { buildOrderMessage, openWhatsApp } from "@/data/whatsapp";
import { MIN_DELIVERY_ORDER } from "@/data/cart";
import { useI18n } from "@/lib/i18n";
import { RangeText } from "@/components/hours/HoursText";

export function CartSheet() {
  const { t } = useI18n();
  const {
    items,
    mode,
    address,
    name,
    subtotal,
    total,
    itemCount,
    updateQuantity,
    removeItem,
    clearCart,
    setMode,
    setAddress,
    setName,
  } = useCart();
  const [isOpen, setIsOpen] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [isWASending, setIsWASending] = useState(false);
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const itemsEndRef = useRef<HTMLDivElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && items.length > 0 && !name) {
      setTimeout(() => nameInputRef.current?.focus(), 400);
    }
  }, [isOpen, items.length, name]);

  const deliveryFee = mode === "livraison" ? 2.5 : 0;

  const handlePay = async () => {
    if (items.length === 0) return;
    if (!name.trim()) {
      toast.error("Entre ton nom ou pseudo");
      nameInputRef.current?.focus();
      return;
    }
    if (mode === "livraison" && !address.trim()) {
      toast.error("Ajoute ton adresse de livraison");
      return;
    }

    if (mode === "livraison" && subtotal < MIN_DELIVERY_ORDER) {
      toast.error(`Minimum ${MIN_DELIVERY_ORDER.toFixed(2).replace(".", ",")}€ pour la livraison`);
      return;
    }
    setIsPaying(true);
    try {
      const lineItems = items.map((i) => ({
        name: i.name,
        price: Math.round(i.price * 100),
        qty: i.quantity,
        custom: i.customization || null,
      }));

      if (mode === "livraison") {
        lineItems.push({
          name: "🚚 Livraison",
          price: Math.round(deliveryFee * 100),
          qty: 1,
          custom: null,
        });
      }

      const res = await fetch("/api/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: lineItems,
          total,
          customerName: name.trim(),
          mode,
          address,
        }),
      });

      const data = await res.json();
      if (data.url) {
        // Save order data for the success page
        try {
          sessionStorage.setItem("ftsd_last_order", JSON.stringify({
            items: items.map((i) => ({ name: i.name, price: i.price, qty: i.quantity, customization: i.customization })),
            total, mode, address, name: name.trim(),
          }));
        } catch {}
        window.location.href = data.url;
      } else {
        toast.error("Erreur de paiement");
      }
    } catch {
      toast.error("Erreur réseau");
    } finally {
      setIsPaying(false);
    }
  };

  const handleWhatsAppOrder = async () => {
    if (items.length === 0) return;
    if (!name.trim()) {
      toast.error("Entre ton nom ou pseudo");
      nameInputRef.current?.focus();
      return;
    }
    if (mode === "livraison" && !address.trim()) {
      toast.error("Ajoute ton adresse de livraison");
      return;
    }

    if (mode === "livraison" && subtotal < MIN_DELIVERY_ORDER) {
      toast.error(`Minimum ${MIN_DELIVERY_ORDER.toFixed(2).replace(".", ",")}€ pour la livraison`);
      return;
    }
    setIsWASending(true);
    try {
      const msg = buildOrderMessage({
        items: items.map((i) => ({
          name: i.name,
          price: i.price,
          qty: i.quantity,
          customization: i.customization || null,
        })),
        total,
        customerName: name.trim(),
        mode,
        address,
        isPaid: false,
        deliveryFee,
      });

      openWhatsApp(msg);

      toast.success("Commande préparée ! Envoie-la sur WhatsApp", {
        duration: 5000,
      });
    } catch {
      toast.error("Erreur d'envoi WhatsApp");
    } finally {
      setIsWASending(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: 50 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -50, height: 0, marginBottom: 0, padding: 0 },
  };

  return (
    <>
      {/* Cart FAB */}
      <motion.button
        data-cart-trigger
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-3 md:right-6 z-40 w-16 h-16 rounded-full bg-gradient-to-r from-brand-red to-red-700 text-white flex items-center justify-center shadow-2xl shadow-red-800/50 hover:shadow-red-700/60 hover:scale-110 transition-all duration-300 border-2 border-red-400/30"
      >
        <ShoppingBag className="h-7 w-7 drop-shadow-[0_2px_3px_rgba(0,0,0,0.4)]" />
        <AnimatePresence>
          {itemCount > 0 && (
            <motion.span
              key={itemCount}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-1 -right-1 bg-white text-brand-red text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-lg border-2 border-white"
            >
              {itemCount > 99 ? "99+" : itemCount}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Sheet Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          >
            {/* Sheet Panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-card border-l border-border/50 shadow-2xl flex flex-col"
            >
              {/* HEADER */}
              <div className="flex items-center justify-between p-4 border-b border-border/50">
                <div className="flex items-center gap-2">
                  <h3 className="font-heading text-lg tracking-wider">
                    <ShoppingBag className="h-5 w-5 inline mr-2 text-brand-red" />
                    Panier
                  </h3>
                  {itemCount > 0 && (
                    <span className="text-xs bg-brand-red/10 text-brand-red px-2 py-0.5 rounded-full font-semibold">
                      {itemCount} article{itemCount > 1 ? "s" : ""}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="rounded-full p-1.5 hover:bg-muted/50 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* MODE TOGGLE */}
              <div className="p-4 border-b border-border/50">
                <div className="flex gap-2">
                  <button
                    onClick={() => setMode("livraison")}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                      mode === "livraison"
                        ? "bg-gradient-to-r from-brand-red to-brand-red-light text-white shadow-lg shadow-brand-red/20"
                        : "bg-brand-red/10 text-brand-red hover:bg-brand-red/20 border border-brand-red/20"
                    }`}
                  >
                    <Truck className="h-4 w-4" />
                    Livraison
                    {mode === "livraison" && (
                      <span className="text-[9px] bg-white/20 px-1.5 py-0.5 rounded-full font-semibold">
                        2,50€
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => setMode("emporter")}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                      mode === "emporter"
                        ? "bg-gradient-to-r from-brand-red to-brand-red-light text-white shadow-lg shadow-brand-red/20"
                        : "bg-brand-red/10 text-brand-red hover:bg-brand-red/20 border border-brand-red/20"
                    }`}
                  >
                    <Store className="h-4 w-4" />
                    À emporter
                  </button>
                </div>

                {/* Delivery address */}
                {mode === "livraison" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-3"
                  >
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="134 Allee du Colonel Fabien, 93320"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-muted/60 border border-border/70 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red/30 transition-all placeholder:text-muted-foreground/50"
                      />
                    </div>
                  </motion.div>
                )}

                {/* Client name - visible en haut */}
                {items.length > 0 && (
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/80" />
                    <input
                      ref={nameInputRef}
                      type="text"
                      placeholder="Ton nom ou pseudo *"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-muted/60 border border-border/70 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red/30 transition-all placeholder:text-muted-foreground/50"
                    />
                  </div>
                )}
              </div>

              {/* ITEMS */}

              {/* Client info - removed from footer */}
              <div className="flex-1 overflow-y-auto p-4">
                {items.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                    <motion.div
                      animate={{ y: [0, -8, 0] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <ShoppingBag className="h-16 w-16 mb-4 text-muted-foreground/60" />
                    </motion.div>
                    <p className="text-sm font-semibold mb-1 text-foreground/90">Ton panier est vide</p>
                    <p className="text-xs text-muted-foreground mb-4">
                      Ajoute des articles depuis le menu
                    </p>
                    <button
                      onClick={() => setIsOpen(false)}
                      className="text-sm text-brand-red font-semibold hover:underline"
                    >
                      Voir le menu →
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Clear all */}
                    <div className="flex justify-end mb-3">
                      {!showConfirmClear ? (
                        <button
                          onClick={() => setShowConfirmClear(true)}
                          className="text-[10px] text-muted-foreground hover:text-red-400 transition-colors flex items-center gap-1"
                        >
                          <Trash2 className="h-3 w-3" /> Vider le panier
                        </button>
                      ) : (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="flex items-center gap-2"
                        >
                          <span className="text-[10px] text-red-400 font-medium">Confirmer ?</span>
                          <button
                            onClick={() => { clearCart(); setShowConfirmClear(false); toast.success("Panier vide"); }}
                            className="text-[10px] text-red-500 font-bold hover:text-red-400 transition-colors"
                          >Oui, vider</button>
                          <button
                            onClick={() => setShowConfirmClear(false)}
                            className="text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                          >{t("cart.no")}</button>
                        </motion.div>
                      )}
                    </div>

                    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-2">
                      <AnimatePresence mode="popLayout">
                        {items.map((item) => (
                          <motion.div
                            key={item.id + (item.customization || "") + item.price}
                            layout
                            variants={itemVariants}
                            exit="exit"
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="group relative flex items-center gap-3 p-3 rounded-xl bg-muted/60 border border-border/60 hover:border-border transition-all"
                          >
                            <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0 bg-muted">
                              <Image src={item.image} alt={item.name} width={56} height={56} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between">
                                <h4 className="text-sm font-semibold truncate">{item.name}</h4>
                                <button onClick={() => removeItem(item.id, item.customization)}
                                  className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:text-red-400"
                                ><X className="h-3 w-3" /></button>
                              </div>
                              {item.customization && (
                                <p className="text-[10px] text-muted-foreground truncate leading-tight mt-0.5">{item.customization}</p>
                              )}
                              <div className="flex items-center justify-between mt-1.5">
                                <div className="flex items-center gap-1 bg-muted/70 rounded-lg p-0.5 border border-border/40">
                                  <button onClick={() => updateQuantity(item.id, -1, item.customization)} disabled={item.quantity <= 1}
                                    className="w-6 h-6 rounded-md flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-30"
                                  ><Minus className="h-3 w-3" /></button>
                                  <span className="w-5 text-center text-xs font-bold">{item.quantity}</span>
                                  <button onClick={() => updateQuantity(item.id, 1, item.customization)} disabled={item.quantity >= 99}
                                    className="w-6 h-6 rounded-md flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-30"
                                  ><Plus className="h-3 w-3" /></button>
                                </div>
                                <span className="text-xs font-bold text-brand-red">
                                  {(item.price * item.quantity).toFixed(2).replace(".", ",")}€
                                </span>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </motion.div>
                    <div ref={itemsEndRef} />
                  </>
                )}
              </div>

              {/* FOOTER */}
              {items.length > 0 && (
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="border-t border-border/50 p-4 space-y-3"
                >
                  {/* Totals */}
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Sous-total</span>
                      <span>{subtotal.toFixed(2).replace(".", ",")}€</span>
                    </div>
                    {deliveryFee > 0 && (
                      <div className="flex justify-between text-muted-foreground">
                        <span className="flex items-center gap-1"><Truck className="h-3 w-3" /> Livraison</span>
                        <span>{deliveryFee.toFixed(2).replace(".", ",")}€</span>
                      </div>
                    )}
                    {mode === "livraison" && subtotal < MIN_DELIVERY_ORDER && (
                      <div className="flex items-center justify-center gap-1 text-[10px] text-amber-600 bg-amber-50/80 dark:bg-amber-900/10 px-2 py-1 rounded-full border border-amber-200/30">
                        <Sparkles className="h-3 w-3" /> Min. {MIN_DELIVERY_ORDER.toFixed(2).replace(".", ",")}€ pour livraison
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-lg pt-2 border-t border-border/30">
                      <span>Total</span>
                      <motion.span key={total} initial={{ scale: 1.2 }} animate={{ scale: 1 }} className="text-brand-red">
                        {total.toFixed(2).replace(".", ",")}€
                      </motion.span>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="space-y-2">
                    <Button onClick={handlePay} disabled={isPaying || items.length === 0 || (mode === "livraison" && subtotal < MIN_DELIVERY_ORDER)}
                      className="w-full py-6 rounded-xl bg-gradient-to-r from-brand-red to-brand-red-light hover:from-brand-red-light hover:to-brand-red text-white font-bold text-base shadow-lg shadow-brand-red/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                    >
                      {isPaying ? (
                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full mr-2" />
                      ) : (<CreditCard className="h-5 w-5 mr-2" />)}
                      Payer {total.toFixed(2).replace(".", ",")}€
                    </Button>

                    <Button onClick={handleWhatsAppOrder} disabled={isWASending || items.length === 0 || (mode === "livraison" && subtotal < MIN_DELIVERY_ORDER)} variant="outline"
                      className="w-full py-5 rounded-xl border-2 border-[#25D366] text-[#25D366] hover:bg-[#25D366] hover:text-white font-bold text-sm transition-all duration-200"
                    >
                      {isWASending ? (
                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="h-4 w-4 border-2 border-[#25D366]/30 border-t-[#25D366] rounded-full mr-2" />
                      ) : (<MessageCircle className="h-5 w-5 mr-2" />)}
                      Commander par WhatsApp
                    </Button>
                  </div>

                  {/* Trust indicators */}
                  <div className="flex items-center justify-center gap-4 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Sparkles className="h-3 w-3 text-amber-400" /> Paiement sécurisé
                    </span>
                    <span className="flex items-center gap-1">
                      <Package className="h-3 w-3" /> Livraison <RangeText />
                    </span>
                  </div>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
