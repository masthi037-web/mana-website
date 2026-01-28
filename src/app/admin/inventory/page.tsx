'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { adminService } from "@/services/admin.service";
import { Category, Catalog, Product, ProductPriceOption } from "@/lib/types";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Loader2, Plus, Folder, Package, Tag, Layers, ChevronRight, Home, Star, Sparkles, Pencil, AlertCircle
} from 'lucide-react';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTenant } from "@/components/providers/TenantContext";
import { ImageUpload } from "@/components/common/ImageUpload";

// Remove hardcoded COMPANY_ID
// const COMPANY_ID = "74f0d689-0ca7-4feb-a123-8e98c151b514";

type ViewLevel = 'CATEGORY' | 'CATALOGUE' | 'PRODUCT' | 'PRICING' | 'SIZE_COLOUR';

export default function AdminInventoryPage() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const { companyId: tenantCompanyId, domain } = useTenant();

    // Fallback to a default if context is missing (though it shouldn't be)
    // or keep the hardcoded for safety? No, user wants dynamic.
    // Fallback to empty string to satisfy type, query enabled check handles the logic
    const companyId = tenantCompanyId || "";

    // --- SELECTION STATE ---
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
    const [selectedCatalogue, setSelectedCatalogue] = useState<Catalog | null>(null);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [selectedPricing, setSelectedPricing] = useState<ProductPriceOption | null>(null);

    // --- VIEW LEVEL ---
    const [level, setLevel] = useState<ViewLevel>('CATEGORY');

    // --- SHEET STATE ---
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [isManageSheetOpen, setIsManageSheetOpen] = useState(false);

    // --- FORM STATES ---
    const [name, setName] = useState("");
    const [desc, setDesc] = useState("");
    const [prodIng, setProdIng] = useState("");
    const [prodBest, setProdBest] = useState("");
    const [prodInst, setProdInst] = useState("");
    const [prodOffer, setProdOffer] = useState("");
    const [prodDeliveryCost, setProdDeliveryCost] = useState("40");
    const [prodQuantity, setProdQuantity] = useState("");
    const [prodStatus, setProdStatus] = useState("ACTIVE");
    const [prodType, setProdType] = useState("");
    const [isFamous, setIsFamous] = useState(false);
    const [price, setPrice] = useState("");
    const [discountedPrice, setDiscountedPrice] = useState("");
    const [qty, setQty] = useState("");
    const [sizeQuantity, setSizeQuantity] = useState("");
    const [sizeStatus, setSizeStatus] = useState("ACTIVE");
    const [isMandatory, setIsMandatory] = useState(false);
    const [image, setImage] = useState<string | null>(null);

    // --- BULK DISCOUNT STATE ---
    const [bulkDiscounts, setBulkDiscounts] = useState<{ qty: number; discount: number }[]>([]);
    const [tempBulkQty, setTempBulkQty] = useState("");
    const [tempBulkDiscount, setTempBulkDiscount] = useState("");

    // --- MORE THAN DISCOUNT STATE ---
    const [moreThanQty, setMoreThanQty] = useState("");
    const [moreThanDiscount, setMoreThanDiscount] = useState("");

    // --- COLOUR STATES ---
    const [colourName, setColourName] = useState("");
    const [colourImage, setColourImage] = useState<string | null>(null);
    const [colourStatus, setColourStatus] = useState("ACTIVE");
    const [colourQuantity, setColourQuantity] = useState("");

    // --- MANAGE SHEET STATE ---
    const [manageMode, setManageMode] = useState<'VIEW' | 'ADD_PRICING' | 'ADD_SIZE_COLOUR' | 'ADD_COLOUR'>('VIEW');
    const [expandedPricingId, setExpandedPricingId] = useState<string | null>(null);
    const [editingItem, setEditingItem] = useState<any | null>(null);

    // --- QUERIES ---

    // 1. Categories
    const { data: categories = [], isLoading: catsLoading } = useQuery({
        queryKey: ['categories', companyId],
        enabled: !!companyId,
        queryFn: async () => {
            const res = await adminService.getAllCategories(companyId);
            return (Array.isArray(res) ? res : []).map((c: any) => ({
                id: String(c.categoryId),
                name: c.categoryName,
                description: c.categoryDescription,
                createdAt: c.createdAt,
                status: c.categoryStatus,
                catalogs: [], // No deep nesting needed for view, we fetch dynamically
                categoryImage: c.categoryImage
            }));
        }
    });

    // 2. Catalogues (Enabled only when Category selected)
    const { data: catalogues = [], isLoading: catlgsLoading } = useQuery({
        queryKey: ['catalogues', selectedCategory?.id],
        enabled: !!selectedCategory?.id,
        queryFn: async () => {
            const res = await adminService.getCataloguesByCategory(selectedCategory!.id);
            return (Array.isArray(res) ? res : []).map((c: any) => ({
                id: String(c.catalogueId),
                name: c.catalogueName,
                description: c.catalogueDescription,
                createdAt: c.createdAt,
                status: c.catalogueStatus,
                products: [],
                catalogueImage: c.catalogueImage
            }));
        }
    });

    // 3. Products (Enabled only when Catalogue selected)
    const { data: products = [], isLoading: prodsLoading } = useQuery({
        queryKey: ['products', selectedCatalogue?.id],
        enabled: !!selectedCatalogue?.id,
        queryFn: async () => {
            const res = await adminService.getProductsByCatalogue(selectedCatalogue!.id);
            return (Array.isArray(res) ? res : []).map((p: any) => ({
                id: String(p.productId),
                name: p.productName,
                price: p.productPrice || 0,
                pricing: [],
                imageId: p.imageId || "",
                productImage: p.productImage, // Original field
                description: p.productInfo || "",
                rating: 0,
                productOffer: p.productOffer,
                colours: p.productColour || [],
                // Include fields for Editing
                productIng: p.productIng,
                productBestBefore: p.productBestBefore,
                productInst: p.productInst,
                productDeliveryCost: p.productDeliveryCost,
                famous: p.famous,
                multipleSetDiscount: p.multipleSetDiscount,
                multipleDiscountMoreThan: p.multipleDiscountMoreThan,
                productPriceAfterDiscount: p.productPriceAfterDiscount,
                updatedAt: p.updatedAt,
                createdAt: p.createdAt,
                productPics: p.productPics, // In case needed
                productQuantity: p.productQuantity,
                productStatus: p.productStatus,
                productType: p.productType // Added missing field
            }));
        }
    });

    // 4. Pricing (Enabled only when Product selected)
    const { data: pricingOptions = [], isLoading: pricingLoading } = useQuery({
        queryKey: ['pricing', selectedProduct?.id],
        enabled: !!selectedProduct?.id,
        queryFn: async () => {
            const res = await adminService.getProductPricing(selectedProduct!.id);
            return (Array.isArray(res) ? res : []).map((p: any) => ({
                id: String(p.productSizeId),
                price: p.productSizePrice,
                priceAfterDiscount: p.productSizePriceAfterDiscount,
                quantity: p.size,
                sizeQuantity: p.sizeQuantity,
                sizeStatus: p.sizeStatus || "ACTIVE"
            }));
        }
    });

    // 5. SizeColours (Fetch sizeColours only when activePricingId is set)
    // We use expandedPricingId to control this query
    // 5. SizeColours (Fetch sizeColours only when activePricingId is set)
    // We use expandedPricingId to control this query
    const { data: sizeColours = [], isLoading: sizeColoursLoading } = useQuery({
        queryKey: ['sizeColours', expandedPricingId],
        enabled: !!expandedPricingId,
        queryFn: async () => {
            const apiSizeColours = await adminService.getProductSizeColours(expandedPricingId!);
            return (Array.isArray(apiSizeColours) ? apiSizeColours : []).map((sc: any) => ({
                id: String(sc.productSizeColourId), // Validate ID field from API
                name: sc.colourName, // Validate if it's colourName or something else. api-types said sizeColour
                price: sc.colourPrice,
                productPics: sc.productPics,
                productSizeColourQuantity: sc.productSizeColourQuantity,
                sizeColourStatus: sc.sizeColourStatus,
                active: true // Assuming active
            }));
        }
    });

    // 6. Colours (Fetch colours when managing product or selected)
    const { data: fetchedColours = [], isLoading: coloursLoading } = useQuery({
        queryKey: ['colours', selectedProduct?.id],
        enabled: !!selectedProduct?.id && (level === 'PRICING' || isManageSheetOpen), // Fetch when diving into product
        queryFn: async () => {
            const res = await adminService.getProductColours(selectedProduct!.id);
            return (Array.isArray(res) ? res : []).map((c: any) => ({
                productColourId: c.productColourId,
                productId: c.productId,
                colour: c.colour,
                productPics: c.productPics,
                productColourQuantity: c.productColourQuantity,
                colourStatus: c.colourStatus
            }));
        }
    });





    const hasColourWithQuantity = fetchedColours.some((c: any) => c.productColourQuantity !== null && c.productColourQuantity !== undefined && c.productColourQuantity !== "");
    // User requested: if one colour quantity is null (implies Size variant mode), disable Quantity for new colours
    const hasColourWithNullQuantity = fetchedColours.length > 0 && fetchedColours.some((c: any) => c.productColourQuantity === null || c.productColourQuantity === undefined || c.productColourQuantity === 0); // Assuming 0 also counts as "no quantity" for this logic? "null" was specific. Let's check falsy.
    // Actually, user said "null". But usually database might return 0.
    // Let's stick to: if we have colors, and NONE of them have >0 quantity? Or specifically if ANY has null?
    // "if one colour quantity is null" -> ANY.
    // Let's strictly check for null/undefined as per request? Or maybe count 0?
    // Let's try:
    const hasColourWithNoQuantity = fetchedColours.length > 0 && fetchedColours.some((c: any) => c.productColourQuantity === null || c.productColourQuantity === undefined || c.productColourQuantity === "");

    // --- EFFECTS ---

    // --- EFFECTS ---
    // Auto-calculate discounted price when Price or Product (Offer) changes
    // Only run if we are in PRICING mode and have a selected product
    useEffect(() => {
        if (level === 'PRICING' && selectedProduct && price) {
            const rawPrice = parseFloat(price);
            if (isNaN(rawPrice)) return;

            if (editingItem && String(price) === String(editingItem.price || "")) {
                // If editing and price hasn't changed from original, don't auto-recalculate discount.
                // This respects manual overrides on existing items.
                return;
            }

            // Extract percentage from offer string like "50% OFF", "50 %", "FLAT 50% OFF"
            // Regex: Look for digits followed optionally by % or space+OFF
            const offer = selectedProduct.productOffer || "";
            const match = offer.match(/(\d+)\s*%?|(\d+)\s+OFF/i);

            if (match) {
                // match[1] or match[2] will have the number
                const percentage = parseFloat(match[1] || match[2]);
                if (!isNaN(percentage)) {
                    const discountValue = (rawPrice * percentage) / 100;
                    const final = Math.round(rawPrice - discountValue);
                    setDiscountedPrice(String(final));
                    return;
                }
            }
            // Fallback: No offer or invalid format -> Discounted Price = Price
            setDiscountedPrice(price);
        } else if (level === 'PRICING' && !price) {
            setDiscountedPrice("");
        }
    }, [price, selectedProduct, level, editingItem]);





    // --- VALIDATION ---
    const validateForm = (silent = false) => {
        // 1. Manage Sheet Validations (Prioritize these if active)
        if (isManageSheetOpen) {
            if (manageMode === 'ADD_COLOUR') {
                const currentType = prodType || selectedProduct?.productType || editingItem?.productType;
                const isMandatory = currentType === 'COLOUR';

                if (!colourName || (!colourImage && !editingItem?.productPics)) {
                    if (!silent) toast({ title: "Validation Error", description: "Colour Name and Image are required", variant: "destructive", duration: 2000 });
                    return false;
                }

                if (isMandatory && (!colourQuantity || Number(colourQuantity) < 0)) {
                    if (!silent) toast({ title: "Validation Error", description: "Quantity is required for Colour Variant", variant: "destructive", duration: 2000 });
                    return false;
                }

                return true;
            }
            if (manageMode === 'ADD_PRICING') {
                if (!qty || !sizeQuantity || !price) {
                    if (!silent) toast({ title: "Validation Error", description: "Size, Quantity, and Price are required", variant: "destructive", duration: 2000 });
                    return false;
                }
                return true;
            }
            if (manageMode === 'ADD_SIZE_COLOUR') {
                if (!name || !sizeQuantity || (!colourImage && !editingItem?.productPics)) {
                    if (!silent) toast({ title: "Validation Error", description: "Name, Quantity, and Image are required", variant: "destructive", duration: 2000 });
                    return false;
                }
                return true;
            }
            // For VIEW in manage sheet, we might skipping main form validation
            return true;
        }

        // 2. Main Form Validations (Category, Catalogue, Product)
        if (level === 'CATEGORY' || level === 'CATALOGUE') {
            if (!name || !desc) {
                if (!silent) toast({ title: "Validation Error", description: "Name and Description are required", variant: "destructive", duration: 2000 });
                return false;
            }
        } else if (level === 'PRODUCT') {
            if (!name || !desc) {
                if (!silent) toast({ title: "Validation Error", description: "Name and Description are required", variant: "destructive", duration: 2000 });
                return false;
            }

            if (!editingItem && !prodType) {
                if (!silent) toast({ title: "Validation Error", description: "Please select a Product Type", variant: "destructive", duration: 2000 });
                return false;
            }

            // Standard Product Validation (Strict)
            const currentType = prodType || editingItem?.productType;
            if (currentType === 'SIMPLE') {
                if (!prodQuantity) {
                    if (!silent) toast({ title: "Validation Error", description: "Available Quantity is required for Standard Product", variant: "destructive", duration: 2000 });
                    return false;
                }
                if (!price) {
                    if (!silent) toast({ title: "Validation Error", description: "Price is required for Standard Product", variant: "destructive", duration: 2000 });
                    return false;
                }
                if (!image && !editingItem?.productImage) {
                    if (!silent) toast({ title: "Validation Error", description: "Product Image is required for Standard Product", variant: "destructive", duration: 2000 });
                    return false;
                }
            }

            // Colour Variant Validation (Strict)
            if (currentType === 'COLOUR') {
                if (!price) {
                    if (!silent) toast({ title: "Validation Error", description: "Price is required for Colour Variant Products", variant: "destructive", duration: 2000 });
                    return false;
                }
            }

            if (prodQuantity && (!price || (!image && !editingItem?.productImage))) {
                if (!silent) toast({ title: "Validation Error", description: "Price and Image are required when Quantity is set", variant: "destructive", duration: 2000 });
                return false;
            }
        }

        return true;
    };

    // --- MUTATIONS ---
    const createMutation = useMutation({
        mutationFn: async () => {
            // Priority: Manage Sheet actions first
            if (isManageSheetOpen) {
                // Manage Sheet Flow
                if (manageMode === 'ADD_PRICING' && selectedProduct) {
                    const hasBasePrice = !!(selectedProduct.price && selectedProduct.price > 0);
                    const pricePayload = hasBasePrice ? {
                        productSizePrice: null,
                        productSizePriceAfterDiscount: null
                    } : {
                        productSizePrice: Number(price),
                        productSizePriceAfterDiscount: discountedPrice ? Number(discountedPrice) : Number(price),
                    };

                    if (editingItem) {
                        return adminService.updateProductSize({
                            productSizeId: Number(editingItem.id),
                            productId: Number(selectedProduct.id),
                            ...pricePayload,
                            size: qty,
                            sizeQuantity: sizeQuantity,
                            sizeStatus: sizeStatus
                        });
                    } else {
                        return adminService.createPricing({
                            productId: Number(selectedProduct.id),
                            ...pricePayload,
                            size: qty,
                            sizeQuantity: sizeQuantity,
                            sizeStatus: sizeStatus
                        });
                    }
                } else if (manageMode === 'ADD_SIZE_COLOUR' && expandedPricingId) {
                    if (editingItem) {
                        return adminService.updateSizeColour({
                            productSizeColourId: Number(editingItem.id),
                            productSizeId: Number(expandedPricingId),
                            colourName: name,
                            colourPrice: Number(price),
                            productSizeColourQuantity: sizeQuantity || "0",
                            productPics: colourImage || "",
                            sizeColourStatus: sizeStatus || "ACTIVE"
                        });
                    } else {
                        return adminService.createSizeColour({
                            productSizeId: Number(expandedPricingId),
                            colourName: name, // Reusing 'name' state
                            colourPrice: Number(price), // Reusing 'price' state
                            productSizeColourQuantity: sizeQuantity || "0",
                            productPics: colourImage || "",
                            sizeColourStatus: sizeStatus || "ACTIVE"
                        });
                    }
                } else if (manageMode === 'ADD_COLOUR' && selectedProduct) {
                    if (editingItem) {
                        return adminService.updateProductColour({
                            productColourId: Number(editingItem.productColourId),
                            productId: Number(selectedProduct.id),
                            productPics: colourImage || "",
                            colourStatus: colourStatus,
                            colour: colourName,
                            productColourQuantity: colourQuantity
                        });
                    } else {
                        return adminService.createProductColour({
                            productId: Number(selectedProduct.id),
                            productPics: colourImage || "",
                            colourStatus: colourStatus,
                            colour: colourName,
                            productColourQuantity: colourQuantity
                        });
                    }
                }
            }

            if (level === 'CATEGORY') {
                if (!name || !desc) {
                    toast({ title: "Validation Error", description: "Name and Description are required", variant: "destructive", duration: 2000 });
                    return;
                }
                if (editingItem) {
                    return adminService.updateCategory({
                        companyId: companyId,
                        categoryId: Number(editingItem.id),
                        categoryName: name,
                        categoryDescription: desc,
                        categoryStatus: editingItem.status || "ACTIVE",
                        categoryImage: image ?? undefined, // Handle null -> undefined, keep ""
                        createdAt: editingItem.createdAt
                    });
                } else {
                    return adminService.createCategory({
                        companyId: companyId,
                        categoryName: name,
                        categoryDescription: desc,
                        categoryStatus: "ACTIVE",
                        categoryImage: image || undefined
                    });
                }
            } else if (level === 'CATALOGUE' && selectedCategory) {
                if (!name || !desc) {
                    toast({ title: "Validation Error", description: "Name and Description are required", variant: "destructive", duration: 2000 });
                    return;
                }
                if (editingItem) {
                    return adminService.updateCatalogue({
                        categoryId: Number(selectedCategory.id),
                        catalogueId: Number(editingItem.id),
                        catalogueName: name,
                        catalogueDescription: desc,
                        catalogueImage: image ?? undefined, // Handle null -> undefined, keep ""
                        catalogueStatus: editingItem.status || "ACTIVE",
                        createdAt: editingItem.createdAt
                    });
                } else {
                    return adminService.createCatalogue({
                        categoryId: selectedCategory.id,
                        catalogueName: name,
                        catalogueDescription: desc,
                        catalogueImage: image || undefined
                    });
                }
            } else if (level === 'PRODUCT' && selectedCatalogue) {
                if (!name || !desc) {
                    toast({ title: "Validation Error", description: "Name and Description are required", variant: "destructive", duration: 2000 });
                    return;
                }

                if (!editingItem && !prodType) {
                    toast({ title: "Validation Error", description: "Please select a Product Type", variant: "destructive", duration: 2000 });
                    return;
                }

                // Standard Product Validation (Strict)
                const currentType = prodType || editingItem?.productType;
                if (currentType === 'SIMPLE') {
                    if (!prodQuantity) {
                        toast({ title: "Validation Error", description: "Available Quantity is required for Standard Product", variant: "destructive", duration: 2000 });
                        return;
                    }
                    if (!price) {
                        toast({ title: "Validation Error", description: "Price is required for Standard Product", variant: "destructive", duration: 2000 });
                        return;
                    }
                    if (!image && !editingItem?.productImage) {
                        toast({ title: "Validation Error", description: "Product Image is required for Standard Product", variant: "destructive", duration: 2000 });
                        return;
                    }
                }

                if (prodQuantity && (!price || !image && !editingItem?.productImage)) {
                    toast({ title: "Validation Error", description: "Price and Image are required when Quantity is set", variant: "destructive", duration: 2000 });
                    return;
                }
                if (editingItem) {
                    return adminService.updateProduct({
                        productId: Number(editingItem.id),
                        catalogueId: Number(selectedCatalogue.id),
                        productName: name,
                        productInfo: desc,
                        productIng: prodIng,
                        productBestBefore: prodBest,
                        productInst: prodInst,
                        productPics: editingItem.productPics || "https://cdn.example.com/products/default.jpg", // Preserve existing or default
                        productStatus: prodStatus,
                        productPrice: Number(price) || 0,
                        productPriceAfterDiscount: discountedPrice ? Number(discountedPrice) : (Number(price) || 0),
                        productDeliveryCost: Number(prodDeliveryCost),
                        famous: isFamous,
                        productImage: image || editingItem.productImage || undefined,
                        productOffer: prodOffer || "0",
                        updatedAt: editingItem.updatedAt,
                        createdAt: editingItem.createdAt,
                        multipleSetDiscount: bulkDiscounts.length > 0
                            ? bulkDiscounts.map(bd => `${bd.qty}-${bd.discount}`).join('&&&')
                            : "",
                        multipleDiscountMoreThan: (moreThanQty && moreThanDiscount)
                            ? `${moreThanQty}-${moreThanDiscount}`
                            : "",
                        productQuantity: prodQuantity,
                        productType: prodType
                    });
                } else {
                    return adminService.createProduct({
                        catalogueId: Number(selectedCatalogue.id),
                        productName: name,
                        productInfo: desc,
                        productIng: prodIng,
                        productBestBefore: prodBest,
                        productInst: prodInst,
                        productPics: "https://cdn.example.com/products/default.jpg",
                        productStatus: prodStatus,
                        // Prices now required
                        productPrice: Number(price) || 0,
                        productPriceAfterDiscount: discountedPrice ? Number(discountedPrice) : (Number(price) || 0),
                        famous: isFamous,
                        productDeliveryCost: Number(prodDeliveryCost),
                        productImage: image || undefined,
                        productOffer: prodOffer || "0",
                        multipleSetDiscount: bulkDiscounts.length > 0
                            ? bulkDiscounts.map(bd => `${bd.qty}-${bd.discount}`).join('&&&')
                            : undefined,
                        productQuantity: prodQuantity,
                        productType: prodType
                    });
                }
            } else if (level === 'PRICING' && selectedProduct && !isManageSheetOpen) {
                // Classic Flow
                const hasBasePrice = !!(selectedProduct.price && selectedProduct.price > 0);
                const pricePayload = hasBasePrice ? {
                    productSizePrice: null,
                    productSizePriceAfterDiscount: null
                } : {
                    productSizePrice: Number(price),
                    productSizePriceAfterDiscount: discountedPrice ? Number(discountedPrice) : Number(price),
                };

                return adminService.createPricing({
                    productId: Number(selectedProduct.id),
                    ...pricePayload,
                    size: qty,
                    sizeQuantity: sizeQuantity,
                    sizeStatus: sizeStatus // Default or from state? Using state.
                });
            } else if (level === 'SIZE_COLOUR' && selectedPricing && !isManageSheetOpen) {
                // Classic Flow
                return adminService.createSizeColour({
                    productSizeId: Number(selectedPricing.id),
                    colourName: name,
                    colourPrice: Number(price),
                    productSizeColourQuantity: "0",
                    sizeColourStatus: "ACTIVE"
                });
            }
        },
        onSuccess: () => {
            toast({ title: "Success", description: editingItem ? "Item updated successfully" : "Item created successfully" });
            setIsSheetOpen(false);
            resetForm();

            // Invalidate relevant queries to refresh list
            if (level === 'CATEGORY') queryClient.invalidateQueries({ queryKey: ['categories'] });
            if (level === 'CATALOGUE') queryClient.invalidateQueries({ queryKey: ['catalogues', selectedCategory?.id] });
            if (level === 'PRODUCT' && !isManageSheetOpen) queryClient.invalidateQueries({ queryKey: ['products', selectedCatalogue?.id] });

            // Refresh pricing if managing PRICING or SIZES (not colours)
            if ((level === 'PRICING' || isManageSheetOpen) && manageMode !== 'ADD_COLOUR') {
                queryClient.invalidateQueries({ queryKey: ['pricing', selectedProduct?.id] });
            }

            // Refresh colours if managing COLOURS
            if (manageMode === 'ADD_COLOUR' && selectedProduct) {
                queryClient.invalidateQueries({ queryKey: ['colours', selectedProduct.id] });
                // Also refresh main product list as colours are there too (optional but safe)
                // queryClient.invalidateQueries({ queryKey: ['products', selectedCatalogue?.id] }); 
                // User asked to call /product/colour/get, which we do via ['colours'] invalidation.
                // We should NOT call /product/size/get, which we avoided by the check above.
            }

            // Refresh sizeColours if managing (using expandedPricingId)
            if (expandedPricingId) queryClient.invalidateQueries({ queryKey: ['sizeColours', expandedPricingId] });

            // If in Manage Sheet, return to VIEW mode, don't close sheet
            if (isManageSheetOpen) {
                setManageMode('VIEW');
                resetForm(); // Clear inputs but keep sheet open
            }
        },
        onError: () => {
            toast({ title: "Error", description: "Failed to create item", variant: "destructive", duration: 2000 });
        }
    });

    const hasChanges = () => {
        if (!editingItem) return true; // Creating new item

        const safeImage = image || "";

        if (level === 'CATEGORY') {
            return name !== editingItem.name ||
                desc !== (editingItem.description || "") ||
                safeImage !== (editingItem.categoryImage || "");
        }
        if (level === 'CATALOGUE') {
            return name !== editingItem.name ||
                desc !== (editingItem.description || "") ||
                safeImage !== (editingItem.catalogueImage || "");
        }
        if (manageMode === 'ADD_PRICING' && editingItem) {
            // Compare as strings with null safety
            const currentQty = String(qty || "").trim();
            const originalQty = String(editingItem.quantity || "").trim();

            const currentSizeQty = String(sizeQuantity || "").trim();
            const originalSizeQty = String(editingItem.sizeQuantity || "").trim();

            // For prices, use float comparison to handle "500" vs 500 etc.
            const currentPrice = parseFloat(String(price || "0"));
            const originalPrice = parseFloat(String(editingItem.price || "0"));

            const currentDiscount = parseFloat(String(discountedPrice || "0"));
            const originalDiscount = parseFloat(String(editingItem.priceAfterDiscount || "0"));

            const currentStatus = String(sizeStatus || "ACTIVE").trim();
            const originalStatus = String(editingItem.sizeStatus || "ACTIVE").trim();

            if (currentQty !== originalQty) return true;
            if (currentSizeQty !== originalSizeQty) return true;
            if (currentPrice !== originalPrice) return true;
            if (currentDiscount !== originalDiscount) return true;
            if (currentStatus !== originalStatus) return true;

            return false;
        }
        return true; // Default allow for other levels if any
    };

    // --- NAVIGATION HANDLERS ---
    const resetForm = () => {
        // Full reset for Product
        setName(""); setDesc(""); setProdIng(""); setProdBest(""); setProdInst(""); setProdOffer("");
        setProdDeliveryCost("40"); setProdQuantity(""); setIsFamous(false); setPrice(""); setDiscountedPrice(""); setQty(""); setSizeQuantity(""); setSizeStatus("ACTIVE"); setIsMandatory(false);
        setProdStatus("ACTIVE"); setProdType("");
        setBulkDiscounts([]); setTempBulkQty(""); setTempBulkDiscount("");
        setMoreThanQty(""); setMoreThanDiscount("");
        setImage(null);
        setColourName(""); setColourImage(null); setColourStatus("ACTIVE"); setColourQuantity("");
        setEditingItem(null);
    };

    const resetVariantFieldsOnly = () => {
        // Reset only variant fields, keep product context active
        setPrice(""); setDiscountedPrice("");
        setQty(""); setSizeQuantity(""); setSizeStatus("ACTIVE");
        setEditingItem(null);
    };

    const handleEditCategory = (cat: any, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingItem(cat);
        setName(cat.name);
        setDesc(cat.description || "");
        setImage(cat.categoryImage || ""); // Initialize with empty string if null
        setLevel('CATEGORY'); // Ensure we are in category mode
        setIsSheetOpen(true);
    };

    const handleEditCatalogue = (catlg: any, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingItem(catlg);
        setName(catlg.name);
        setDesc(catlg.description || "");
        setImage(catlg.catalogueImage || ""); // Initialize with empty string if null
        setLevel('CATALOGUE'); // Ensure we are in catalogue mode
        setIsSheetOpen(true);
    };

    const handleEditProduct = (prod: any, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingItem(prod);
        // Basic
        setName(prod.name);
        setDesc(prod.description || prod.productInfo || "");
        setImage(prod.productImage || "");
        setProdIng(prod.ingredients || prod.productIng || "");
        setProdBest(prod.bestBefore || prod.productBestBefore || "");
        setProdInst(prod.instructions || prod.productInst || "");
        setProdStatus(prod.productStatus || "ACTIVE");
        setProdType(prod.productType || "");

        // Price & Offer
        setPrice(String(prod.productPrice || prod.price || ""));
        setDiscountedPrice(String(prod.productPriceAfterDiscount || prod.priceAfterDiscount || ""));
        setProdOffer(prod.productOffer || "");
        setProdDeliveryCost(String(prod.productDeliveryCost || prod.deliveryCost || "40"));
        setProdQuantity(String(prod.productQuantity || ""));
        setIsFamous(!!prod.famous);

        // Bulk Discounts Parsing
        if (prod.multipleSetDiscount) {
            try {
                const parts = prod.multipleSetDiscount.toString().split('&&&');
                const parsed = parts.map((p: string) => {
                    const [q, d] = p.split('-');
                    return { qty: parseInt(q), discount: parseInt(d) };
                }).filter((x: any) => !isNaN(x.qty) && !isNaN(x.discount));
                setBulkDiscounts(parsed);
            } catch (e) { console.error("Error parsing bulk discounts", e); setBulkDiscounts([]); }
        } else {
            setBulkDiscounts([]);
        }

        // More Than Parsing
        if (prod.multipleDiscountMoreThan) {
            try {
                const [q, d] = prod.multipleDiscountMoreThan.toString().split('-');
                setMoreThanQty(q || "");
                setMoreThanDiscount(d || "");
            } catch (e) { setMoreThanQty(""); setMoreThanDiscount(""); }
        } else {
            setMoreThanQty("");
            setMoreThanDiscount("");
        }

        setLevel('PRODUCT');
        setIsSheetOpen(true);
    };

    const openCreateSheet = () => {
        resetForm();
        setIsSheetOpen(true);
    };

    // --- UTILS ---
    const calculateDiscount = (basePrice: number, offerText: string) => {
        if (!offerText || !basePrice) return basePrice;

        // Improved match for integers and decimals (e.g. "5", "5.5", "10.5%")
        // Looks for numbers at the start or preceded by space/non-digit
        const match = offerText.match(/(\d+(\.\d+)?)/);
        if (match && match[1]) {
            const pct = parseFloat(match[1]);
            if (!isNaN(pct) && pct > 0 && pct <= 100) {
                return Math.round(basePrice * (1 - pct / 100));
            }
        }
        return basePrice;
    };

    // Auto-calculate Discounted Price when Offer or Price changes (for Product Level)
    // Auto-calculate Discounted Price when Offer or Price changes (for Product Level)
    useEffect(() => {
        // Only run for Product level editing, NOT when adding variants (which shares 'price' state)
        // If we are adding pricing variants, valid manageMode is 'ADD_PRICING'
        if (level === 'PRODUCT' && price && manageMode !== 'ADD_PRICING') {
            const calculated = calculateDiscount(Number(price), prodOffer || "");
            setDiscountedPrice(String(calculated));
        }
    }, [price, prodOffer, level, manageMode]);

    // --- BULK DISCOUNT HANDLERS ---
    const addBulkDiscount = () => {
        if (!tempBulkQty || !tempBulkDiscount) return;
        setBulkDiscounts([...bulkDiscounts, { qty: parseInt(tempBulkQty), discount: parseInt(tempBulkDiscount) }]);
        setTempBulkQty("");
        setTempBulkDiscount("");
    };

    const removeBulkDiscount = (index: number) => {
        setBulkDiscounts(bulkDiscounts.filter((_, i) => i !== index));
    };

    // --- RENDER HELPERS ---
    const renderBreadcrumbs = () => (
        <div className="flex items-center text-sm text-muted-foreground mb-6 overflow-x-auto whitespace-nowrap">
            <button onClick={() => setLevel('CATEGORY')} className="hover:text-primary flex items-center">
                <Home className="w-4 h-4 mr-1" /> Categories
            </button>
            {level !== 'CATEGORY' && selectedCategory && (
                <>
                    <ChevronRight className="w-4 h-4 mx-2" />
                    <button onClick={() => setLevel('CATALOGUE')} className="hover:text-primary font-medium text-foreground">
                        {selectedCategory.name}
                    </button>
                </>
            )}
            {(level === 'PRODUCT' || level === 'PRICING' || level === 'SIZE_COLOUR') && selectedCatalogue && (
                <>
                    <ChevronRight className="w-4 h-4 mx-2" />
                    <button onClick={() => setLevel('PRODUCT')} className="hover:text-primary font-medium text-foreground">
                        {selectedCatalogue.name}
                    </button>
                </>
            )}
            {(level === 'PRICING' || level === 'SIZE_COLOUR') && selectedProduct && (
                <>
                    <ChevronRight className="w-4 h-4 mx-2" />
                    <button onClick={() => setLevel('PRICING')} className="hover:text-primary font-medium text-foreground">
                        {selectedProduct.name}
                    </button>
                </>
            )}
            {level === 'SIZE_COLOUR' && selectedPricing && (
                <>
                    <ChevronRight className="w-4 h-4 mx-2" />
                    <span className="font-bold text-primary">
                        {selectedPricing.quantity}
                    </span>
                </>
            )}
        </div>
    );

    const renderSheetForm = () => {
        return (
            <div className="space-y-4 py-4">
                {(level === 'CATEGORY' || level === 'CATALOGUE' || level === 'PRODUCT' || level === 'SIZE_COLOUR') && (
                    <div className="space-y-2">
                        <Label>Name <span className="text-destructive">*</span></Label>
                        <Input placeholder="Name" value={name} onChange={e => setName(e.target.value)} />
                    </div>
                )}

                {(level === 'CATEGORY' || level === 'CATALOGUE' || level === 'PRODUCT') && (
                    <div className="space-y-2">
                        <Label>Description / Info <span className="text-destructive">*</span></Label>
                        <Input placeholder="Description" value={desc} onChange={e => setDesc(e.target.value)} />
                    </div>
                )}

                {/* PRODUCT STRUCTURE SELECTION (New Product Only) */}
                {level === 'PRODUCT' && !editingItem && !prodType ? (
                    <div className="space-y-6 animate-in hover:fade-in slide-in-from-bottom-5 duration-500">
                        <div className="text-center space-y-2 mb-8">
                            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                                <Sparkles className="w-8 h-8 text-primary" />
                            </div>
                            <h3 className="text-xl font-bold tracking-tight">Select Product Type</h3>
                            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                                Choose the structure that best fits your product inventory needs.
                            </p>
                        </div>

                        <div className="grid gap-3">
                            {[
                                {
                                    id: 'SIMPLE',
                                    title: 'Standard Product',
                                    desc: 'No Colour, No Size (e.g. Jewellery)',
                                    icon: Tag,
                                    color: 'bg-blue-50 text-blue-600 border-blue-200'
                                },
                                {
                                    id: 'COLOUR',
                                    title: 'Colour Variant',
                                    desc: 'With Colour Only (e.g. Sarees)',
                                    icon: Layers,
                                    color: 'bg-pink-50 text-pink-600 border-pink-200'
                                },
                                {
                                    id: 'SIZE',
                                    title: 'Size Variant',
                                    desc: 'With Size Only (e.g. Pickles)',
                                    icon: Package,
                                    color: 'bg-amber-50 text-amber-600 border-amber-200'
                                },
                                {
                                    id: 'SIZE_COLOUR',
                                    title: 'Complex Variant',
                                    desc: 'With Size & Colour (e.g. Dress)',
                                    icon: Folder,
                                    color: 'bg-purple-50 text-purple-600 border-purple-200'
                                }
                            ].map((opt) => (
                                <button
                                    key={opt.id}
                                    onClick={() => {
                                        setProdType(opt.id);
                                        // Auto-configure form based on type
                                        if (opt.id === 'SIMPLE') {
                                            // Ensure quantity is editable (cleared or default)
                                            setProdQuantity("");
                                        } else {
                                            // Disable main quantity to force variants
                                            setProdQuantity("");
                                        }
                                    }}
                                    className={`relative group flex items-start gap-4 p-4 rounded-xl border text-left transition-all duration-300 hover:shadow-md hover:scale-[1.02] bg-white hover:border-primary/50`}
                                >
                                    <div className={`p-3 rounded-full ${opt.color} shadow-sm group-hover:shadow-md transition-all`}>
                                        <opt.icon className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-foreground group-hover:text-primary transition-colors">{opt.title}</h4>
                                        <p className="text-xs text-muted-foreground mt-1 font-medium">{opt.desc}</p>
                                    </div>
                                    <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/30 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Hidden Input for Type Logic Persistence */}
                        {level === 'PRODUCT' && (
                            <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 mb-4 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-primary" />
                                    <span className="text-xs font-bold text-primary uppercase tracking-wider">
                                        Type: {editingItem ? (editingItem.productType || "Standard") : (prodType === 'SIMPLE' ? 'Standard' : prodType === 'COLOUR' ? 'Colour Variant' : prodType === 'SIZE' ? 'Size Variant' : 'Complex')}
                                    </span>
                                </div>
                                {!editingItem && (
                                    <Button variant="ghost" size="sm" className="h-6 text-[10px] uppercase font-bold text-muted-foreground hover:text-foreground" onClick={() => setProdType("")}>Change</Button>
                                )}
                            </div>
                        )}
                        {/* Remainder of Form... */}
                    </>
                )}

                {/* MAIN PRODUCT FORM (Only if Type selected or Editing) */}
                {level === 'PRODUCT' && (!!prodType || !!editingItem) && (
                    <div className="grid grid-cols-2 gap-6 pt-2">
                        {/* Row 1: Available Quantity (Only for Simple/Standard) */}
                        {(prodType === 'SIMPLE' || (editingItem && (editingItem.productType === 'SIMPLE' || (!editingItem.productType && !editingItem.multipleSetDiscount && !editingItem.pricing?.length && !editingItem.colours?.length)))) ? (
                            <div className="space-y-2">
                                <Label>Available Quantity {(prodType || editingItem?.productType) === 'SIMPLE' && <span className="text-destructive">*</span>}</Label>
                                <Input placeholder="10" value={prodQuantity} onChange={e => { const val = e.target.value.replace(/[^0-9]/g, ''); if (val.length <= 5) setProdQuantity(val); }} min={0} />
                            </div>
                        ) : (
                            <div className="space-y-2 opacity-50 pointer-events-none">
                                <Label>Available Quantity</Label>
                                <Input value="Managed by Variants" disabled className="bg-muted" />
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label>Price {(prodQuantity || (prodType || editingItem?.productType) === 'SIMPLE' || (prodType || editingItem?.productType) === 'COLOUR') ? <span className="text-destructive">*</span> : null}</Label>
                            {(prodType || selectedProduct?.productType || editingItem?.productType) === 'SIZE' || (prodType || selectedProduct?.productType || editingItem?.productType) === 'SIZE_COLOUR' ? (
                                <Input value="Managed by Variants" disabled className="bg-muted" />
                            ) : (
                                <Input type="number" placeholder="100" value={price} onChange={e => { const val = e.target.value.replace(/[^0-9.]/g, ''); if (val.length <= 6) setPrice(val); }} min={0} />
                            )}
                        </div>



                        {/* Row 2: Product Offer & Offer Price */}
                        <div className="space-y-2">
                            <Label>Product Offer</Label>
                            <div className="relative">

                                <>
                                    <Input
                                        type="number"
                                        placeholder="50"
                                        value={prodOffer}
                                        onChange={e => { const val = e.target.value.replace(/[^0-9]/g, ''); if (Number(val) < 99) setProdOffer(val); }}
                                        className="pr-16"
                                    />
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-muted-foreground text-sm">
                                        % OFF
                                    </div>
                                </>

                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Offer Price</Label>
                            <Input
                                type="number"
                                placeholder="80"
                                value={discountedPrice}
                                onChange={e => setDiscountedPrice(e.target.value)}
                                className="bg-muted/30 border-dashed"
                                disabled
                            />
                        </div>

                        {/* Row 3: Status & Famous */}
                        <div className="space-y-2">
                            <Label>Status</Label>
                            <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={prodStatus}
                                onChange={e => setProdStatus(e.target.value)}
                            >
                                <option value="ACTIVE">Active</option>
                                <option value="INACTIVE">Inactive</option>
                                <option value="OUTOFSTOCK">Out of Stock</option>
                            </select>
                        </div>
                        <div className="flex items-center space-x-2 h-10 mt-6">
                            <Checkbox id="famous" checked={isFamous} onCheckedChange={(c) => setIsFamous(!!c)} />
                            <Label htmlFor="famous" className="cursor-pointer">Mark as Famous?</Label>
                        </div>
                    </div>
                )}

                {((level === 'CATEGORY' || level === 'CATALOGUE') || (level === 'PRODUCT' && (!!prodType || !!editingItem))) && (
                    <div className="pt-2">
                        <ImageUpload
                            value={image || undefined}
                            onChange={setImage}
                            label={<span>{level.charAt(0) + level.slice(1).toLowerCase()} Image {level === 'PRODUCT' && (prodQuantity || (prodType || editingItem?.productType) === 'SIMPLE') ? <span className="text-destructive">*</span> : null}</span>}
                            companyDomain={domain || ""}
                            maxFiles={level === 'CATEGORY' || level === 'CATALOGUE' ? 1 : level === 'PRODUCT' ? 4 : 3}
                        />
                    </div>
                )}

                {/* Product Extra Fields */}
                {level === 'PRODUCT' && (!!prodType || !!editingItem) && (
                    <>

                        <div className="space-y-2">
                            <Label>Instructions</Label>
                            <Input placeholder="Usage Instructions" value={prodInst} onChange={e => setProdInst(e.target.value)} />
                        </div>


                        {/* Bulk Discounts Section */}
                        <div className="space-y-3 pt-2 border-t">
                            <Label className="text-sm font-semibold">Bulk Discounts (e.g. Buy 3 Get 10% off)</Label>
                            <div className="flex gap-2 items-end">
                                <div className="space-y-1 flex-1">
                                    <Label className="text-xs">Qty (e.g. 3)</Label>
                                    <Input
                                        type="number"
                                        placeholder="3"
                                        value={tempBulkQty}
                                        onChange={e => { const val = e.target.value.replace(/[^0-9]/g, ''); if (val.length <= 4) setTempBulkQty(val); }}
                                        className="h-8"
                                    />
                                </div>
                                <div className="space-y-1 flex-1">
                                    <Label className="text-xs">Discount % (e.g. 10)</Label>
                                    <Input
                                        type="number"
                                        placeholder="10"
                                        value={tempBulkDiscount}
                                        onChange={e => { const val = e.target.value.replace(/[^0-9]/g, ''); if (Number(val) < 99) setTempBulkDiscount(val); }}
                                        className="h-8"
                                    />
                                </div>
                                <Button size="sm" variant="secondary" onClick={addBulkDiscount} type="button" className="h-8">Add</Button>
                            </div>

                            {/* List of Discounts */}
                            {bulkDiscounts.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {bulkDiscounts.map((bd, i) => (
                                        <div key={i} className="flex items-center gap-2 bg-secondary/50 px-3 py-1 rounded-full text-xs font-medium border">
                                            <span>Buy {bd.qty} get {bd.discount}% Off</span>
                                            <button onClick={() => removeBulkDiscount(i)} className="text-muted-foreground hover:text-destructive transition-colors">
                                                ×
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* More Than Discount Section */}
                        <div className="space-y-3 pt-2 border-t">
                            <Label className="text-sm font-semibold">Bulk Discount (Buy More than 5 Get 20% Off)</Label>
                            <div className="flex gap-2 items-end">
                                <div className="space-y-1 flex-1">
                                    <Label className="text-xs">More than Qty (e.g. 5)</Label>
                                    <Input
                                        type="number"
                                        placeholder="5"
                                        value={moreThanQty}
                                        onChange={e => { const val = e.target.value.replace(/[^0-9]/g, ''); if (val.length <= 4) setMoreThanQty(val); }}
                                        className="h-8"
                                    />
                                </div>
                                <div className="space-y-1 flex-1">
                                    <Label className="text-xs">Discount % (e.g. 20)</Label>
                                    <Input
                                        type="number"
                                        placeholder="20"
                                        value={moreThanDiscount}
                                        onChange={e => { const val = e.target.value.replace(/[^0-9]/g, ''); if (Number(val) < 99) setMoreThanDiscount(val); }}
                                        className="h-8"
                                    />
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {/* Pricing Fields */}
                {
                    level === 'PRICING' && (
                        <>
                            <div className="space-y-2">
                                <Label>Quantity Label (e.g. 1 Kg)</Label>
                                <Input placeholder="1 Kg" value={qty} onChange={e => setQty(e.target.value)} />
                            </div>

                            <div className="space-y-2">
                                <Label>Available Quantity for this Variant</Label>
                                <Input
                                    placeholder={selectedProduct?.productQuantity ? "Managed by Product" : "Unit Qty"}
                                    value={sizeQuantity}
                                    onChange={e => setSizeQuantity(e.target.value.replace(/[^0-9]/g, ''))}
                                    disabled={!!selectedProduct?.productQuantity}
                                />
                            </div>

                            {selectedProduct && selectedProduct.productPrice > 0 ? (
                                <div className="p-3 bg-muted rounded-md border border-dashed my-2">
                                    <p className="text-sm font-medium text-muted-foreground">
                                        Base Price is set on the Product ({selectedProduct.productPrice}).
                                        Variant pricing is disabled.
                                    </p>
                                </div>
                            ) : (
                                <>
                                    <div className="space-y-2">
                                        <Label>Price</Label>
                                        <Input type="number" placeholder="100" value={price} onChange={e => { const val = e.target.value.replace(/[^0-9.]/g, ''); if (val.length <= 6) setPrice(val); }} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Discounted Price (Calculated)</Label>
                                        <Input
                                            type="number"
                                            placeholder="80"
                                            value={discountedPrice}
                                            onChange={e => setDiscountedPrice(e.target.value.replace(/[^0-9.]/g, ''))}
                                            className="bg-muted/30 border-dashed"
                                        />
                                        <p className="text-[10px] text-muted-foreground">
                                            Auto-calculated from Product Offer ({selectedProduct?.productOffer || "None"}). You can override this.
                                        </p>
                                    </div>
                                </>
                            )}
                        </>
                    )
                }

                {/* Size Colour Fields */}
                {
                    level === 'SIZE_COLOUR' && (
                        <>
                            <div className="space-y-2">
                                <Label>Price</Label>
                                <Input type="number" placeholder="10" value={price} onChange={e => { const val = e.target.value.replace(/[^0-9.]/g, ''); if (val.length <= 6) setPrice(val); }} />
                            </div>
                        </>
                    )
                }

                <Button onClick={() => { if (validateForm()) createMutation.mutate(); }} disabled={createMutation.isPending || !hasChanges() || !validateForm(true)} className="w-full mt-6">
                    {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {editingItem ? "Update" : "Create"} {level === 'PRICING' ? 'Variant' : level.charAt(0) + level.slice(1).toLowerCase()}
                </Button>
            </div >
        );
    };

    const isLoading = catsLoading || catlgsLoading || prodsLoading || pricingLoading || sizeColoursLoading;

    return (
        <div className="container mx-auto py-8 px-4 max-w-6xl">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Inventory</h1>
                    <p className="text-muted-foreground mt-1">Manage your catalogue hierarchy</p>
                </div>
                <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                    <SheetTrigger asChild>
                        <Button onClick={openCreateSheet} size="lg" className="rounded-full shadow-md">
                            <Plus className="w-4 h-4 mr-2" /> Add {level === 'PRICING' ? 'Variant' : level.charAt(0) + level.slice(1).toLowerCase()}
                        </Button>
                    </SheetTrigger>
                    <SheetContent className="sm:max-w-md overflow-y-auto">
                        <SheetHeader>
                            <SheetTitle>
                                {level === 'CATEGORY' && (editingItem ? "Edit Category" : "Add New Category")}
                                {level === 'CATALOGUE' && (editingItem ? "Edit Catalogue" : `Add Catalogue to ${selectedCategory?.name}`)}
                                {level === 'PRODUCT' && `Add Product to ${selectedCatalogue?.name}`}
                                {level === 'PRICING' && `Add Variant to ${selectedProduct?.name}`}
                                {level === 'SIZE_COLOUR' && `Add Size Colour to ${selectedPricing?.quantity}`}
                            </SheetTitle>
                            <SheetDescription>
                                {level === 'CATEGORY' && (editingItem ? "Update category details." : "Create a new top-level category.")}
                                {level === 'CATALOGUE' && (editingItem ? "Update catalogue details." : `Creating a new catalogue under ${selectedCategory?.name}.`)}
                                {level === 'PRODUCT' && `Creating a new product under ${selectedCatalogue?.name}.`}
                                {level === 'PRICING' && `Adding a pricing variant for ${selectedProduct?.name}.`}
                                {level === 'SIZE_COLOUR' && `Adding a size colour for the ${selectedPricing?.quantity} variant.`}
                            </SheetDescription>
                        </SheetHeader>
                        {renderSheetForm()}
                    </SheetContent>
                </Sheet>

                {/* MANAGE PRODUCT SHEET */}
                <Sheet open={isManageSheetOpen} onOpenChange={(open) => {
                    setIsManageSheetOpen(open);
                    if (!open) {
                        setManageMode('VIEW');
                        setExpandedPricingId(null);
                        resetForm(); // Clear editingItem so items reappear in list
                    }
                }}>
                    <SheetContent className="overflow-y-auto sm:max-w-xl w-full">
                        <SheetHeader className="mb-6">
                            <SheetTitle className="flex items-center gap-3 text-2xl">
                                {selectedProduct?.productImage ? (
                                    <img src={selectedProduct.productImage} className="w-10 h-10 rounded-lg object-cover shadow-sm" alt="" />
                                ) : <Package className="w-8 h-8 text-primary/80" />}
                                {selectedProduct?.name}
                            </SheetTitle>
                            <SheetDescription>
                                Manage pricing variants and size colours.
                            </SheetDescription>
                        </SheetHeader>

                        {/* PRODUCT BADGES OVERVIEW */}
                        {selectedProduct && (
                            <div className="flex gap-2 mb-8">
                                {selectedProduct.famous && (
                                    <div className="flex items-center gap-1 bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-bold border border-yellow-200">
                                        <Star className="w-3 h-3 fill-yellow-700" /> FAMOUS
                                    </div>
                                )}
                                {selectedProduct.productOffer && (
                                    <div className="flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold border border-green-200">
                                        <Sparkles className="w-3 h-3" /> {selectedProduct.productOffer}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* COLOURS SECTION */}
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-bold flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-primary" /> Product Colours
                                </h3>
                                {manageMode !== 'ADD_COLOUR' && (() => {
                                    const currentType = prodType || selectedProduct?.productType || editingItem?.productType;

                                    if (currentType === 'SIMPLE') {
                                        return (
                                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200 text-xs font-medium animate-in fade-in">
                                                <Tag className="w-3 h-3" />
                                                Disabled for Standard Product
                                            </div>
                                        );
                                    }

                                    if (currentType === 'SIZE') {
                                        return (
                                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200 text-xs font-medium animate-in fade-in">
                                                <Tag className="w-3 h-3" />
                                                Disabled for Size Variant
                                            </div>
                                        );
                                    }

                                    if (currentType === 'SIZE_COLOUR') {
                                        return (
                                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-50 text-purple-600 border border-purple-200 text-xs font-medium animate-in fade-in">
                                                <Layers className="w-3 h-3" />
                                                Managed in Size Variant
                                            </div>
                                        );
                                    }

                                    if ((!selectedProduct?.price || selectedProduct.price <= 0)) {
                                        return (
                                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-50 text-red-600 border border-red-200 text-xs font-medium animate-in fade-in">
                                                <AlertCircle className="w-3 h-3" />
                                                Add Price to enable colours
                                            </div>
                                        );
                                    }

                                    if (selectedProduct?.productQuantity) {
                                        return (
                                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200 text-xs font-medium animate-in fade-in slide-in-from-right-2">
                                                <span className="relative flex h-2 w-2">
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                                                </span>
                                                Single variant mode active
                                            </div>
                                        );
                                    }

                                    return (
                                        <Button size="sm" onClick={() => { setManageMode('ADD_COLOUR'); resetForm(); }} variant="outline" className="h-8 rounded-full">
                                            <Plus className="w-3 h-3 mr-1" /> Add Colour
                                        </Button>
                                    );
                                })()}
                            </div>

                            {/* Standard Product Warning */}
                            {(prodType || selectedProduct?.productType || editingItem?.productType) === 'SIMPLE' && (
                                <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100 rounded-xl p-4 flex items-start gap-3 shadow-sm">
                                    <div className="bg-white p-2 rounded-full shadow-sm text-amber-500 mt-0.5">
                                        <Tag className="w-4 h-4" />
                                    </div>
                                    <div className="space-y-1">
                                        <h4 className="text-sm font-bold text-amber-900">Standard Product (Simple)</h4>
                                        <p className="text-xs text-amber-700/80 leading-relaxed">
                                            This product is set to <b>Type: Standard</b>. Colour variants cannot be added to this type.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {((prodType || selectedProduct?.productType || editingItem?.productType) === 'SIZE') && (
                                <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100 rounded-xl p-4 flex items-start gap-3 shadow-sm">
                                    <div className="bg-white p-2 rounded-full shadow-sm text-amber-500 mt-0.5">
                                        <Tag className="w-4 h-4" />
                                    </div>
                                    <div className="space-y-1">
                                        <h4 className="text-sm font-bold text-amber-900">Disabled for Size Variant</h4>
                                        <p className="text-xs text-amber-700/80 leading-relaxed">
                                            This product is set to <b>Type: Size Variant</b>. Colour variants cannot be added to this type.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Complex Product Warning */}
                            {((prodType || selectedProduct?.productType || editingItem?.productType) === 'SIZE_COLOUR') && (
                                <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-100 rounded-xl p-4 flex items-start gap-3 shadow-sm">
                                    <div className="bg-white p-2 rounded-full shadow-sm text-purple-500 mt-0.5">
                                        <Layers className="w-4 h-4" />
                                    </div>
                                    <div className="space-y-1">
                                        <h4 className="text-sm font-bold text-purple-900">Complex Variant (Sizes & Colours)</h4>
                                        <p className="text-xs text-purple-700/80 leading-relaxed">
                                            This is a <b>Complex Variant</b>. Colours are managed within specific sizes in the "Product Pricing / Sizes" section.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {(!selectedProduct?.price || selectedProduct.price <= 0) && (prodType || selectedProduct?.productType || editingItem?.productType) !== 'SIZE' && (prodType || selectedProduct?.productType || editingItem?.productType) !== 'SIZE_COLOUR' && (prodType || selectedProduct?.productType || editingItem?.productType) !== 'SIMPLE' && (
                                <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-100 rounded-xl p-4 flex items-start gap-3 shadow-sm">
                                    <div className="bg-white p-2 rounded-full shadow-sm text-red-500 mt-0.5">
                                        <AlertCircle className="w-4 h-4" />
                                    </div>
                                    <div className="space-y-1">
                                        <h4 className="text-sm font-bold text-red-900">Colour Variants Disabled (Price Missing)</h4>
                                        <p className="text-xs text-red-700/80 leading-relaxed">
                                            This product has no price set. Please add a base price to the product to enable adding colour variants.
                                        </p>
                                    </div>
                                </div>
                            )}



                            {/* ADD COLOUR FORM */}
                            {manageMode === 'ADD_COLOUR' && (
                                <div className="bg-muted/30 p-4 rounded-xl border border-dashed border-primary/30 animate-in fade-in zoom-in-95 duration-300">
                                    <h4 className="font-semibold text-sm mb-3 text-primary">New Colour Variant</h4>
                                    <div className="space-y-3">
                                        <div className="space-y-2">
                                            <Label className="text-xs">Colour Name <span className="text-destructive">*</span></Label>
                                            <Input value={colourName} onChange={e => setColourName(e.target.value)} className="h-8 bg-background" placeholder="e.g. Red, Blue, Army Green" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs">Quantity {(prodType || selectedProduct?.productType || editingItem?.productType) === 'COLOUR' && <span className="text-destructive">*</span>}</Label>
                                            <Input
                                                value={colourQuantity}
                                                onChange={e => setColourQuantity(e.target.value)}
                                                className="h-8 bg-background"
                                                placeholder={hasColourWithNoQuantity && !editingItem ? "Managed by Sizes" : "0"}
                                                disabled={hasColourWithNoQuantity && !editingItem}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <ImageUpload
                                                value={colourImage || undefined}
                                                onChange={setColourImage}
                                                label={<span>Colour Image <span className="text-destructive">*</span></span>}
                                                companyDomain={domain || ""}
                                                maxFiles={1}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs">Status</Label>
                                            <select
                                                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                                value={colourStatus}
                                                onChange={e => setColourStatus(e.target.value)}
                                            >
                                                <option value="ACTIVE">Active</option>
                                                <option value="INACTIVE">Inactive</option>
                                                <option value="OUTOFSTOCK">Out of Stock</option>
                                            </select>
                                        </div>
                                        <div className="flex gap-2 pt-2">
                                            <Button size="sm" onClick={() => { if (validateForm()) createMutation.mutate(); }} disabled={createMutation.isPending} className="flex-1">
                                                {createMutation.isPending && <Loader2 className="w-3 h-3 mr-2 animate-spin" />} {editingItem ? "Update Colour" : "Save Colour"}
                                            </Button>
                                            <Button size="sm" variant="ghost" onClick={() => { setManageMode('VIEW'); resetForm(); }} className="flex-1">Cancel</Button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* COLOUR LIST */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {/* COLOUR LIST */}
                                {fetchedColours.length > 0 ? (
                                    fetchedColours.map((c: any) => (
                                        <div key={c.productColourId} className="border rounded-lg p-2 bg-card relative group overflow-hidden">
                                            <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity z-10 flex gap-1">
                                                <Button size="icon" variant="secondary" className="h-6 w-6 rounded-full shadow-sm" onClick={(e) => {
                                                    e.stopPropagation();
                                                    setEditingItem(c);
                                                    setColourName(c.colour);
                                                    setColourImage(c.productPics);
                                                    setColourStatus(c.colourStatus);
                                                    setColourQuantity(c.productColourQuantity || "");
                                                    setManageMode('ADD_COLOUR');
                                                }}>
                                                    <Pencil className="h-3 w-3" />
                                                </Button>
                                            </div>
                                            <div className="aspect-square rounded-md bg-muted/50 mb-2 overflow-hidden">
                                                {c.productPics ? (
                                                    <img src={c.productPics} alt={c.colour} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-muted-foreground/30">
                                                        <Sparkles className="w-6 h-6" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="font-bold text-sm truncate">{c.colour}</div>
                                            <div className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded w-fit ${c.colourStatus === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                {c.colourStatus}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    !manageMode && <div className="col-span-full text-center py-6 text-muted-foreground text-sm italic">No colours added yet.</div>
                                )}
                            </div>
                        </div>

                        {/* PRICING SECTION */}
                        <div className="space-y-6 mt-8 border-t pt-6">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-bold flex items-center gap-2">
                                    <Tag className="w-4 h-4 text-primary" /> Size Variants
                                </h3>
                                {manageMode !== 'ADD_PRICING' && (() => {
                                    const currentType = prodType || selectedProduct?.productType || editingItem?.productType;

                                    if (currentType === 'SIMPLE') {
                                        return (
                                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200 text-xs font-medium animate-in fade-in">
                                                <Tag className="w-3 h-3" />
                                                Disabled for Standard Product
                                            </div>
                                        );
                                    }

                                    if (currentType === 'COLOUR') {
                                        return (
                                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200 text-xs font-medium animate-in fade-in">
                                                <Tag className="w-3 h-3" />
                                                Disabled for Colour Variant
                                            </div>
                                        );
                                    }

                                    if (selectedProduct?.productQuantity) {
                                        return (
                                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200 text-xs font-medium animate-in fade-in slide-in-from-right-2">
                                                <span className="relative flex h-2 w-2">
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                                                </span>
                                                Single variant mode active
                                            </div>
                                        );
                                    }

                                    if (hasColourWithQuantity) {
                                        return (
                                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200 text-xs font-medium animate-in fade-in slide-in-from-right-2">
                                                <span className="relative flex h-2 w-2">
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                                                </span>
                                                Colour Quantities Set
                                            </div>
                                        );
                                    }

                                    return (
                                        <Button size="sm" onClick={() => {
                                            setManageMode('ADD_PRICING');
                                            resetVariantFieldsOnly();
                                            // Pre-fill if base price exists
                                            if (selectedProduct && selectedProduct.price > 0) {
                                                setPrice(String(selectedProduct.price));
                                                // Auto-calc discount if offer exists (Prioritize active edited offer)
                                                const offerToUse = prodOffer || selectedProduct?.productOffer;
                                                if (offerToUse) {
                                                    const calculated = calculateDiscount(selectedProduct.price, offerToUse);
                                                    setDiscountedPrice(String(calculated));
                                                } else {
                                                    setDiscountedPrice(String(selectedProduct.price));
                                                }
                                            }
                                        }} variant="outline" className="h-8 rounded-full">
                                            <Plus className="w-3 h-3 mr-1" /> Add Size
                                        </Button>
                                    );
                                })()}
                            </div>

                            {/* Standard Product Warning */}
                            {(prodType || selectedProduct?.productType || editingItem?.productType) === 'SIMPLE' && (
                                <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100 rounded-xl p-4 flex items-start gap-3 shadow-sm">
                                    <div className="bg-white p-2 rounded-full shadow-sm text-amber-500 mt-0.5">
                                        <Tag className="w-4 h-4" />
                                    </div>
                                    <div className="space-y-1">
                                        <h4 className="text-sm font-bold text-amber-900">Standard Product (Simple)</h4>
                                        <p className="text-xs text-amber-700/80 leading-relaxed">
                                            This product is set to <b>Type: Standard</b>. Size/Pricing variants cannot be added to this type.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Colour Variant Warning */}
                            {(prodType || selectedProduct?.productType || editingItem?.productType) === 'COLOUR' && (
                                <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100 rounded-xl p-4 flex items-start gap-3 shadow-sm">
                                    <div className="bg-white p-2 rounded-full shadow-sm text-amber-500 mt-0.5">
                                        <Tag className="w-4 h-4" />
                                    </div>
                                    <div className="space-y-1">
                                        <h4 className="text-sm font-bold text-amber-900">Pricing Variants Disabled</h4>
                                        <p className="text-xs text-amber-700/80 leading-relaxed">
                                            This is a Colour Variant product which does not have size variants. Pricing is managed within each colour.
                                        </p>
                                    </div>
                                </div>
                            )}





                            {/* ADD PRICING FORM */}
                            {manageMode === 'ADD_PRICING' && (
                                <div className="bg-muted/30 p-4 rounded-xl border border-dashed border-primary/30 animate-in fade-in zoom-in-95 duration-300">
                                    <h4 className="font-semibold text-sm mb-3 text-primary">{editingItem ? "Edit Pricing Variant" : "New Size Variant"}</h4>
                                    <div className="space-y-3">
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-1">
                                                <Label className="text-xs">Size <span className="text-destructive">*</span></Label>
                                                <Input value={qty} onChange={e => setQty(e.target.value)} className="h-8 bg-background" placeholder="Qty" />
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-xs">Quantity <span className="text-destructive">*</span></Label>
                                                <Input
                                                    value={sizeQuantity}
                                                    onChange={e => { const val = e.target.value.replace(/[^0-9]/g, ''); if (val.length <= 5) setSizeQuantity(val); }}
                                                    className="h-8 bg-background"
                                                    placeholder={(selectedProduct?.productQuantity || (selectedProduct?.productType || prodType) === 'SIZE_COLOUR') ? "Managed by Product/Colours" : "Unit Qty"}
                                                    disabled={!!selectedProduct?.productQuantity || (selectedProduct?.productType || prodType || editingItem?.productType) === 'SIZE_COLOUR'}
                                                />

                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-xs">Price <span className="text-destructive">*</span></Label>
                                                <Input
                                                    type="number"
                                                    value={price}
                                                    onChange={e => {
                                                        const newVal = e.target.value.replace(/[^0-9.]/g, '');
                                                        if (newVal.length > 6) return;
                                                        setPrice(newVal);
                                                        // Auto-calc if offer exists
                                                        // Use centralized function to ensure consistency
                                                        // Prioritize active edited offer if available
                                                        const currentOffer = (typeof prodOffer === 'string' && prodOffer.trim().length > 0) ? prodOffer : "";
                                                        const dbOffer = selectedProduct?.productOffer || "";
                                                        // For variants, we trust the offer we found (active or db)
                                                        const offerToUse = currentOffer || dbOffer;

                                                        if (offerToUse) {
                                                            const valNum = parseFloat(newVal);
                                                            if (!isNaN(valNum)) {
                                                                const calculated = calculateDiscount(valNum, offerToUse);
                                                                setDiscountedPrice(String(calculated));
                                                            }
                                                        } else {
                                                            setDiscountedPrice(newVal);
                                                        }
                                                    }}
                                                    className="h-8 bg-background"
                                                    placeholder="0"
                                                    disabled={!!(selectedProduct?.price && selectedProduct.price > 0)}
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs">
                                                Discounted Price (Auto)
                                                {(prodOffer || selectedProduct?.productOffer) && <span className="text-emerald-600 font-medium ml-1">({prodOffer || selectedProduct?.productOffer}% OFF)</span>}
                                            </Label>
                                            <Input
                                                type="number"
                                                value={discountedPrice}
                                                onChange={e => setDiscountedPrice(e.target.value.replace(/[^0-9.]/g, ''))}
                                                className="h-8 bg-background border-dashed"
                                                placeholder="Auto"
                                                disabled={true}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs">Status</Label>
                                            <select
                                                className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                                value={sizeStatus}
                                                onChange={e => setSizeStatus(e.target.value)}
                                            >
                                                <option value="ACTIVE">Active</option>
                                                <option value="INACTIVE">Inactive</option>
                                                <option value="OUTOFSTOCK">Out of Stock</option>
                                            </select>
                                        </div>
                                        <div className="flex gap-2 pt-2">
                                            <Button size="sm" onClick={() => { if (qty && sizeQuantity && price) createMutation.mutate(); }} disabled={createMutation.isPending || !qty || !sizeQuantity || !price} className="flex-1">
                                                {createMutation.isPending && <Loader2 className="w-3 h-3 mr-2 animate-spin" />} {editingItem ? "Update Variant" : "Save Variant"}
                                            </Button>
                                            <Button size="sm" variant="ghost" onClick={() => { setManageMode('VIEW'); resetForm(); }} className="flex-1">Cancel</Button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* PRICING LIST */}
                            <div className="space-y-3">
                                {pricingOptions.map((p: any) => {
                                    // Hide the item if it is currently being edited (only if editing a PRICE variant)
                                    if (manageMode === 'ADD_PRICING' && editingItem && editingItem.id === p.id) return null;

                                    return (
                                        <div key={p.id} className="border rounded-xl p-0 overflow-hidden bg-card shadow-sm transition-all hover:shadow-md">
                                            <div className="flex items-center">
                                                <div
                                                    className="flex-1 p-3 flex items-center justify-between cursor-pointer hover:bg-muted/50 transition-colors"
                                                    onClick={() => setExpandedPricingId(expandedPricingId === p.id ? null : p.id)}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className={`p-2 rounded-full ${expandedPricingId === p.id ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                                                            {expandedPricingId === p.id ? <Layers className="w-4 h-4" /> : <Tag className="w-4 h-4" />}
                                                        </div>
                                                        <div>
                                                            <div className="font-bold text-sm">{p.quantity}</div>
                                                            <div className="text-xs text-muted-foreground flex items-center gap-2">
                                                                {p.priceAfterDiscount && p.priceAfterDiscount < p.price ? (
                                                                    <>
                                                                        <span className="line-through">₹{p.price}</span>
                                                                        <span className="font-bold text-primary">₹{p.priceAfterDiscount}</span>
                                                                    </>
                                                                ) : (
                                                                    <span>₹{p.price}</span>
                                                                )}
                                                                <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${p.sizeStatus === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                                    {p.sizeStatus}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform duration-300 ${expandedPricingId === p.id ? 'rotate-90' : ''}`} />
                                                </div>
                                                <div className="pr-3">
                                                    <Button size="icon" variant="ghost" className="h-7 w-7 rounded-full hover:bg-muted" onClick={(e) => {
                                                        e.stopPropagation();
                                                        setEditingItem(p);
                                                        setQty(p.quantity);
                                                        setSizeQuantity(p.sizeQuantity || "");
                                                        setPrice(String(p.price));
                                                        setDiscountedPrice(String(p.priceAfterDiscount));
                                                        setSizeStatus(p.sizeStatus || "ACTIVE");
                                                        setManageMode('ADD_PRICING');
                                                    }}>
                                                        <Pencil className="h-3 w-3 text-muted-foreground" />
                                                    </Button>
                                                </div>
                                            </div>

                                            {/* Size Colour SECTION (EXPANDED) */}
                                            {expandedPricingId === p.id && (!(((prodType || selectedProduct?.productType || editingItem?.productType) === 'SIZE' || (p.sizeQuantity && Number(p.sizeQuantity) > 0)) && !sizeColoursLoading && sizeColours.length === 0)) && (
                                                <div className="bg-muted/20 border-t p-4 animate-in slide-in-from-top-2 duration-300">
                                                    <div className="flex items-center justify-between mb-4">
                                                        <h5 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Size Colours</h5>
                                                        {manageMode !== 'ADD_SIZE_COLOUR' && (
                                                            ((prodType || selectedProduct?.productType || editingItem?.productType) === 'SIZE') ? (
                                                                <div className="flex items-center gap-1.5 bg-amber-50 text-amber-700 px-2 py-1 rounded text-[10px] font-medium border border-amber-100">
                                                                    <Tag className="w-3 h-3" />
                                                                    <span>Disabled for Size Variant</span>
                                                                </div>
                                                            ) : (p.sizeQuantity && Number(p.sizeQuantity) > 0) ? (
                                                                <div className="flex items-center gap-1.5 bg-amber-50 text-amber-700 px-2 py-1 rounded text-[10px] font-medium border border-amber-100">
                                                                    <AlertCircle className="w-3 h-3" />
                                                                    <span>Remove Quantity from Variant to add colours</span>
                                                                </div>
                                                            ) : (
                                                                <Button size="icon" variant="ghost" className="h-6 w-6 rounded-full hover:bg-primary/10 hover:text-primary" onClick={() => { setManageMode('ADD_SIZE_COLOUR'); resetForm(); }}>
                                                                    <Plus className="w-4 h-4" />
                                                                </Button>
                                                            )
                                                        )}
                                                    </div>

                                                    {/* ADD SIZE COLOUR FORM */}
                                                    {manageMode === 'ADD_SIZE_COLOUR' && (
                                                        <div className="bg-background p-3 rounded-lg border mb-3 shadow-sm animate-in zoom-in-95">
                                                            <div className="space-y-3">
                                                                <div className="space-y-1">
                                                                    <Label className="text-xs">Name <span className="text-destructive">*</span></Label>
                                                                    <Input value={name} onChange={e => setName(e.target.value)} className="h-7" placeholder="e.g. Green" />
                                                                </div>
                                                                <div>
                                                                    <ImageUpload
                                                                        value={colourImage || undefined}
                                                                        onChange={setColourImage}
                                                                        label={<span>Variant Image <span className="text-destructive">*</span></span>}
                                                                        companyDomain={domain || ""}
                                                                        maxFiles={1}
                                                                    />
                                                                </div>
                                                                <div className="flex gap-3">
                                                                    <div className="space-y-1 flex-1">
                                                                        <Label className="text-xs">Extra Price</Label>
                                                                        <Input type="number" value={price} onChange={e => setPrice(e.target.value)} className="h-7" placeholder="10" />
                                                                    </div>
                                                                    <div className="pt-6 flex items-center space-x-2">
                                                                        {/* Mandatory field removed */}
                                                                    </div>
                                                                </div>
                                                                <div className="grid grid-cols-2 gap-3">
                                                                    <div className="space-y-1">
                                                                        <Label className="text-xs">Quantity <span className="text-destructive">*</span></Label>
                                                                        <Input value={sizeQuantity} onChange={e => setSizeQuantity(e.target.value)} className="h-7" placeholder="0" />
                                                                    </div>
                                                                    <div className="space-y-1">
                                                                        <Label className="text-xs">Status</Label>
                                                                        <select
                                                                            className="flex h-7 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                                                            value={sizeStatus}
                                                                            onChange={e => setSizeStatus(e.target.value)}
                                                                        >
                                                                            <option value="ACTIVE">Active</option>
                                                                            <option value="INACTIVE">Inactive</option>
                                                                            <option value="OUTOFSTOCK">Out of Stock</option>
                                                                        </select>
                                                                    </div>
                                                                </div>
                                                                <div className="flex gap-2 pt-1">
                                                                    <Button size="sm" onClick={() => createMutation.mutate()} disabled={createMutation.isPending} className="h-7 text-xs w-full">Save Size Colour</Button>
                                                                    <Button size="sm" variant="ghost" onClick={() => setManageMode('VIEW')} className="h-7 text-xs w-full">Cancel</Button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}

                                                    <div className="space-y-2">
                                                        {sizeColoursLoading ? <div className="text-xs text-center py-2 text-muted-foreground">Loading options...</div> :
                                                            // sizeColours.length === 0 ? <div className="text-xs text-center py-2 text-muted-foreground italic">No options configured.</div> :
                                                            sizeColours.map((sc: any) => (
                                                                <div key={sc.id} className="bg-background/80 border rounded p-2 flex justify-between items-center text-sm">
                                                                    <div className="flex items-center gap-3">
                                                                        {sc.productPics && (
                                                                            <img src={sc.productPics} alt={sc.name} className="w-8 h-8 rounded-md object-cover border" />
                                                                        )}
                                                                        <div>
                                                                            <div className="font-medium flex items-center gap-2">
                                                                                {sc.name}
                                                                                <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded ${sc.sizeColourStatus === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                                                    {sc.sizeColourStatus?.charAt(0)}
                                                                                </span>
                                                                            </div>
                                                                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                                                                                <span>Qty: {sc.productSizeColourQuantity || 0}</span>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="font-mono font-bold text-xs text-emerald-600">+₹{sc.price}</span>
                                                                        <Button size="icon" variant="ghost" className="h-6 w-6 rounded-full hover:bg-muted" onClick={() => {
                                                                            setEditingItem(sc);
                                                                            setName(sc.name);
                                                                            setPrice(String(sc.price));
                                                                            setSizeQuantity(sc.productSizeColourQuantity || "");
                                                                            setColourImage(sc.productPics || null);
                                                                            setSizeStatus(sc.sizeColourStatus || "ACTIVE");
                                                                            setManageMode('ADD_SIZE_COLOUR');
                                                                        }}>
                                                                            <Pencil className="h-3 w-3 text-muted-foreground" />
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            ))
                                                        }
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                                {pricingOptions.length === 0 && !selectedProduct?.productQuantity && !hasColourWithQuantity &&
                                    (prodType || selectedProduct?.productType || editingItem?.productType) !== 'SIMPLE' &&
                                    (prodType || selectedProduct?.productType || editingItem?.productType) !== 'COLOUR' &&
                                    <div className="text-center py-8 text-muted-foreground text-sm">No sizes found. Add one to get started.</div>}
                            </div>
                        </div>
                    </SheetContent>
                </Sheet>
            </div>

            {renderBreadcrumbs()}

            {isLoading && <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}

            {
                !isLoading && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

                        {/* LEVEL 0: CATEGORIES */}
                        {level === 'CATEGORY' && categories.map((cat: any) => (
                            <Card key={cat.id}
                                className="cursor-pointer hover:border-primary/50 transition-all hover:shadow-md group"
                                onClick={() => { setSelectedCategory(cat); setLevel('CATALOGUE'); }}>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-base font-bold">{cat.name}</CardTitle>
                                    <div className="flex items-center gap-2">
                                        <Button size="icon" variant="ghost" className="h-6 w-6 hover:bg-muted" onClick={(e) => handleEditCategory(cat, e)}>
                                            <Pencil className="h-3 w-3 text-muted-foreground" />
                                        </Button>
                                        <Folder className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                    </div>
                                </CardHeader>
                            </Card>
                        ))}

                        {/* LEVEL 1: CATALOGUES */}
                        {level === 'CATALOGUE' && catalogues.map((catlg: any) => (
                            <Card key={catlg.id}
                                className="cursor-pointer hover:border-primary/50 transition-all hover:shadow-md group"
                                onClick={() => { setSelectedCatalogue(catlg); setLevel('PRODUCT'); }}>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-base font-bold">{catlg.name}</CardTitle>
                                    <div className="flex items-center gap-2">
                                        <Button size="icon" variant="ghost" className="h-6 w-6 hover:bg-muted" onClick={(e) => handleEditCatalogue(catlg, e)}>
                                            <Pencil className="h-3 w-3 text-muted-foreground" />
                                        </Button>
                                        <Layers className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-xs text-muted-foreground truncate">{catlg.products?.map((p: any) => p.name).join(', ')}</p>
                                </CardContent>
                            </Card>
                        ))}

                        {/* LEVEL 2: PRODUCTS */}
                        {level === 'PRODUCT' && products.map((prod: any) => (
                            <Card key={prod.id}
                                className="cursor-pointer hover:border-primary/50 transition-all hover:shadow-md group relative overflow-hidden"
                                onClick={() => { setSelectedProduct(prod); setIsManageSheetOpen(true); }}>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-base font-bold truncate pr-6">{prod.name}</CardTitle>
                                    <div className="flex items-center gap-2">
                                        <div className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${!prod.productType || prod.productType === 'SIMPLE' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                            prod.productType === 'COLOUR' ? 'bg-pink-50 text-pink-600 border-pink-100' :
                                                prod.productType === 'SIZE' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                                    'bg-purple-50 text-purple-600 border-purple-100'
                                            }`}>
                                            {!prod.productType || prod.productType === 'SIMPLE' ? 'Standard' :
                                                prod.productType === 'COLOUR' ? 'Colour' :
                                                    prod.productType === 'SIZE' ? 'Size' : 'Complex'}
                                        </div>
                                        <Button size="icon" variant="ghost" className="h-6 w-6 hover:bg-muted" onClick={(e) => handleEditProduct(prod, e)}>
                                            <Pencil className="h-3 w-3 text-muted-foreground" />
                                        </Button>
                                        <Package className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="absolute top-0 right-0 p-2 flex flex-col gap-1 items-end">
                                        {prod.famous && (
                                            <div className="bg-yellow-100 text-yellow-700 p-1 rounded-full shadow-sm">
                                                <Star className="w-3 h-3 fill-yellow-700" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="mt-2 flex items-center gap-2">
                                        {(() => {
                                            if (!prod.productOffer) return null;
                                            const offerVal = parseFloat(prod.productOffer.toString().replace(/[^0-9.]/g, ''));
                                            if (isNaN(offerVal) || offerVal <= 0) return null;

                                            return (
                                                <span className="text-[10px] bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                                                    <Sparkles className="w-3 h-3" />
                                                    {prod.productOffer}
                                                </span>
                                            );
                                        })()}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}

                        {/* LEVEL 3: PRICING */}
                        {level === 'PRICING' && pricingOptions.map((p: any) => (
                            <Card key={p.id}
                                className="cursor-pointer hover:border-primary/50 transition-all hover:shadow-md group"
                                onClick={() => { setSelectedPricing(p); setLevel('SIZE_COLOUR'); }}>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-base font-bold">{p.quantity}</CardTitle>
                                    <Tag className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                </CardHeader>
                                <CardContent>
                                    <div className="mb-2">
                                        {p.priceAfterDiscount && p.priceAfterDiscount < p.price ? (
                                            <div className="flex flex-col">
                                                <span className="text-2xl font-bold text-primary">₹{p.priceAfterDiscount}</span>
                                                <span className="text-sm text-muted-foreground line-through decoration-destructive/50">₹{p.price}</span>
                                            </div>
                                        ) : (
                                            <div className="text-2xl font-bold text-primary">₹{p.price}</div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}

                        {/* LEVEL 4: SIZE COLOURS */}
                        {level === 'SIZE_COLOUR' && selectedPricing && (
                            sizeColours.map((sc: any) => (
                                <Card key={sc.id} className="hover:border-border transition-all">
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-base font-bold">{sc.name}</CardTitle>
                                        {/* {sc.mandatory && <span className="text-[10px] bg-destructive/10 text-destructive px-1.5 py-0.5 rounded font-bold">MANDATORY</span>} */}
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-lg font-bold text-emerald-600">+₹{sc.price}</div>
                                    </CardContent>
                                </Card>
                            ))
                        )}

                        {/* Empty States */}
                        {level === 'CATEGORY' && categories.length === 0 && <div className="col-span-3 text-center py-10 text-muted-foreground">No Categories found. Create one to get started.</div>}
                    </div>
                )
            }
        </div >
    );
}
