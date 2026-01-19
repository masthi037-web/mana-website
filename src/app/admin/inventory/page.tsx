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
    Loader2, Plus, Folder, Package, Tag, Layers, ChevronRight, Home, Star, Sparkles, Pencil
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

type ViewLevel = 'CATEGORY' | 'CATALOGUE' | 'PRODUCT' | 'PRICING' | 'ADDON';

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
    const [isFamous, setIsFamous] = useState(false);
    const [price, setPrice] = useState("");
    const [discountedPrice, setDiscountedPrice] = useState("");
    const [qty, setQty] = useState("");
    const [isMandatory, setIsMandatory] = useState(false);
    const [image, setImage] = useState<string | null>(null);

    // --- MANAGE SHEET STATE ---
    const [manageMode, setManageMode] = useState<'VIEW' | 'ADD_PRICING' | 'ADD_ADDON'>('VIEW');
    const [expandedPricingId, setExpandedPricingId] = useState<string | null>(null);
    const [editingItem, setEditingItem] = useState<any | null>(null);

    // --- QUERIES ---

    // 1. Categories
    const { data: categories = [], isLoading: catsLoading } = useQuery({
        queryKey: ['categories', companyId],
        enabled: !!companyId,
        queryFn: async () => {
            const res = await adminService.getAllCategories(companyId);
            return res.map((c: any) => ({
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
            return res.map((c: any) => ({
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
            return res.map((p: any) => ({
                id: String(p.productId),
                name: p.productName,
                price: p.productPrice || 0,
                // We'll need pricing for the drill down, but we fetch it fresh on click essentially or here?
                // Actually the API returns some, but we decided to fetch fresh pricing on click.
                // For the list view, we just need basic info.
                pricing: [],
                imageId: p.imageId || "",
                productImage: p.productImage,
                description: p.productInfo || "",
                rating: 0,
                productOffer: p.productOffer
            }));
        }
    });

    // 4. Pricing (Enabled only when Product selected)
    const { data: pricingOptions = [], isLoading: pricingLoading } = useQuery({
        queryKey: ['pricing', selectedProduct?.id],
        enabled: !!selectedProduct?.id,
        queryFn: async () => {
            const res = await adminService.getProductPricing(selectedProduct!.id);
            return res.map((p: any) => ({
                id: String(p.productPricingId),
                price: p.productPrice,
                priceAfterDiscount: p.productPriceAfterDiscount,
                quantity: p.productQuantity,
                addons: []
            }));
        }
    });

    // 5. Addons (Fetch addons only when activePricingId is set)
    // We use expandedPricingId to control this query
    const { data: addons = [], isLoading: addonsLoading } = useQuery({
        queryKey: ['addons', expandedPricingId],
        enabled: !!expandedPricingId,
        queryFn: async () => {
            const apiAddons = await adminService.getProductAddons(expandedPricingId!);
            return apiAddons.map((a: any) => ({
                id: String(a.productAddonId),
                name: a.addonName,
                price: a.addonPrice,
                mandatory: a.mandatory
            }));
        }
    });

    // --- EFFECTS ---
    // Auto-calculate discounted price when Price or Product (Offer) changes
    // Only run if we are in PRICING mode and have a selected product
    useEffect(() => {
        if (level === 'PRICING' && selectedProduct && price) {
            const rawPrice = parseFloat(price);
            if (isNaN(rawPrice)) return;

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
    }, [price, selectedProduct, level]);



    // --- MUTATIONS ---
    const createMutation = useMutation({
        mutationFn: async () => {
            if (level === 'CATEGORY') {
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
                return adminService.createProduct({
                    catalogueId: Number(selectedCatalogue.id),
                    productName: name,
                    productInfo: desc,
                    productIng: prodIng,
                    productBestBefore: prodBest,
                    productInst: prodInst,
                    productPics: "https://cdn.example.com/products/default.jpg",
                    productStatus: "ACTIVE",
                    famous: isFamous,
                    productDeliveryCost: Number(prodDeliveryCost),
                    productImage: image || undefined,
                    productOffer: prodOffer || undefined
                });
            } else if (level === 'PRICING' && selectedProduct && !isManageSheetOpen) {
                // Classic Flow
                return adminService.createPricing({
                    productId: Number(selectedProduct.id),
                    productPrice: Number(price),
                    productPriceAfterDiscount: discountedPrice ? Number(discountedPrice) : Number(price),
                    productQuantity: qty
                });
            } else if (level === 'ADDON' && selectedPricing && !isManageSheetOpen) {
                // Classic Flow
                return adminService.createAddon({
                    productPricingId: Number(selectedPricing.id),
                    addonName: name,
                    addonPrice: Number(price),
                    mandatory: isMandatory,
                    active: true
                });
            } else if (isManageSheetOpen) {
                // Manage Sheet Flow
                if (manageMode === 'ADD_PRICING' && selectedProduct) {
                    return adminService.createPricing({
                        productId: Number(selectedProduct.id),
                        productPrice: Number(price),
                        productPriceAfterDiscount: discountedPrice ? Number(discountedPrice) : Number(price),
                        productQuantity: qty
                    });
                } else if (manageMode === 'ADD_ADDON' && expandedPricingId) {
                    return adminService.createAddon({
                        productPricingId: Number(expandedPricingId),
                        addonName: name,
                        addonPrice: Number(price),
                        mandatory: isMandatory,
                        active: true
                    });
                }
            }
        },
        onSuccess: () => {
            toast({ title: "Success", description: editingItem ? "Item updated successfully" : "Item created successfully" });
            setIsSheetOpen(false);
            resetForm();

            // Invalidate relevant queries to refresh list
            if (level === 'CATEGORY') queryClient.invalidateQueries({ queryKey: ['categories'] });
            if (level === 'CATALOGUE') queryClient.invalidateQueries({ queryKey: ['catalogues', selectedCategory?.id] });
            if (level === 'PRODUCT') queryClient.invalidateQueries({ queryKey: ['products', selectedCatalogue?.id] });

            // Refresh pricing if managing
            if (level === 'PRICING' || isManageSheetOpen) queryClient.invalidateQueries({ queryKey: ['pricing', selectedProduct?.id] });

            // Refresh addons if managing (using expandedPricingId)
            if (expandedPricingId) queryClient.invalidateQueries({ queryKey: ['addons', expandedPricingId] });

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
        return true; // Default allow for other levels if any
    };

    // --- NAVIGATION HANDLERS ---
    const resetForm = () => {
        setName(""); setDesc(""); setProdIng(""); setProdBest(""); setProdInst(""); setProdOffer("");
        setProdDeliveryCost("40"); setIsFamous(false); setPrice(""); setDiscountedPrice(""); setQty(""); setIsMandatory(false);
        setImage(null);
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

    const openCreateSheet = () => {
        resetForm();
        setIsSheetOpen(true);
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
            {(level === 'PRODUCT' || level === 'PRICING' || level === 'ADDON') && selectedCatalogue && (
                <>
                    <ChevronRight className="w-4 h-4 mx-2" />
                    <button onClick={() => setLevel('PRODUCT')} className="hover:text-primary font-medium text-foreground">
                        {selectedCatalogue.name}
                    </button>
                </>
            )}
            {(level === 'PRICING' || level === 'ADDON') && selectedProduct && (
                <>
                    <ChevronRight className="w-4 h-4 mx-2" />
                    <button onClick={() => setLevel('PRICING')} className="hover:text-primary font-medium text-foreground">
                        {selectedProduct.name}
                    </button>
                </>
            )}
            {level === 'ADDON' && selectedPricing && (
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
                {(level === 'CATEGORY' || level === 'CATALOGUE' || level === 'PRODUCT' || level === 'ADDON') && (
                    <div className="space-y-2">
                        <Label>Name</Label>
                        <Input placeholder="Name" value={name} onChange={e => setName(e.target.value)} />
                    </div>
                )}

                {(level === 'CATEGORY' || level === 'CATALOGUE' || level === 'PRODUCT') && (
                    <>
                        <div className="space-y-2">
                            <Label>Description / Info</Label>
                            <Input placeholder="Description" value={desc} onChange={e => setDesc(e.target.value)} />
                        </div>
                        <div className="pt-2">
                            <ImageUpload
                                value={image || undefined}
                                onChange={setImage}
                                label={`${level.charAt(0) + level.slice(1).toLowerCase()} Image`}
                                companyDomain={domain || ""}
                                maxFiles={level === 'CATEGORY' || level === 'CATALOGUE' ? 1 : level === 'PRODUCT' ? 4 : 3}
                            />
                        </div>
                    </>
                )}

                {/* Product Extra Fields */}
                {level === 'PRODUCT' && (
                    <>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Ingredients</Label>
                                <Input placeholder="Ingredients" value={prodIng} onChange={e => setProdIng(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Best Before</Label>
                                <Input placeholder="15 days" value={prodBest} onChange={e => setProdBest(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Delivery Cost</Label>
                                <Input type="number" placeholder="40" value={prodDeliveryCost} onChange={e => setProdDeliveryCost(e.target.value)} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Instructions</Label>
                            <Input placeholder="Storage Instructions" value={prodInst} onChange={e => setProdInst(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>Product Offer (e.g. 50% OFF)</Label>
                            <Input placeholder="Offer text" value={prodOffer} onChange={e => setProdOffer(e.target.value)} />
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox id="famous" checked={isFamous} onCheckedChange={(c) => setIsFamous(!!c)} />
                            <Label htmlFor="famous">Mark as Famous?</Label>
                        </div>
                    </>
                )}

                {/* Pricing Fields */}
                {level === 'PRICING' && (
                    <>
                        <div className="space-y-2">
                            <Label>Quantity Label (e.g. 1 Kg)</Label>
                            <Input placeholder="1 Kg" value={qty} onChange={e => setQty(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>Price</Label>
                            <Input type="number" placeholder="100" value={price} onChange={e => setPrice(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>Discounted Price (Calculated)</Label>
                            <Input
                                type="number"
                                placeholder="80"
                                value={discountedPrice}
                                onChange={e => setDiscountedPrice(e.target.value)}
                                className="bg-muted/30 border-dashed"
                            />
                            <p className="text-[10px] text-muted-foreground">
                                Auto-calculated from Product Offer ({selectedProduct?.productOffer || "None"}). You can override this.
                            </p>
                        </div>
                    </>
                )}

                {/* Addon Fields */}
                {level === 'ADDON' && (
                    <>
                        <div className="space-y-2">
                            <Label>Price</Label>
                            <Input type="number" placeholder="10" value={price} onChange={e => setPrice(e.target.value)} />
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox id="mandatory" checked={isMandatory} onCheckedChange={(c) => setIsMandatory(!!c)} />
                            <Label htmlFor="mandatory">Is Mandatory?</Label>
                        </div>
                    </>
                )}

                <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending || !hasChanges()} className="w-full mt-6">
                    {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {editingItem ? "Update" : "Create"} {level === 'PRICING' ? 'Variant' : level.charAt(0) + level.slice(1).toLowerCase()}
                </Button>
            </div>
        );
    };

    const isLoading = catsLoading || catlgsLoading || prodsLoading || pricingLoading || addonsLoading;

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
                                {level === 'ADDON' && `Add Addon to ${selectedPricing?.quantity}`}
                            </SheetTitle>
                            <SheetDescription>
                                {level === 'CATEGORY' && (editingItem ? "Update category details." : "Create a new top-level category.")}
                                {level === 'CATALOGUE' && (editingItem ? "Update catalogue details." : `Creating a new catalogue under ${selectedCategory?.name}.`)}
                                {level === 'PRODUCT' && `Creating a new product under ${selectedCatalogue?.name}.`}
                                {level === 'PRICING' && `Adding a pricing variant for ${selectedProduct?.name}.`}
                                {level === 'ADDON' && `Adding an addon for the ${selectedPricing?.quantity} variant.`}
                            </SheetDescription>
                        </SheetHeader>
                        {renderSheetForm()}
                    </SheetContent>
                </Sheet>

                {/* MANAGE PRODUCT SHEET */}
                <Sheet open={isManageSheetOpen} onOpenChange={(open) => {
                    setIsManageSheetOpen(open);
                    if (!open) { setManageMode('VIEW'); setExpandedPricingId(null); }
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
                                Manage pricing variants and addons.
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

                        <div className="space-y-6">
                            {/* PRICING SECTION */}
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-bold flex items-center gap-2">
                                    <Tag className="w-4 h-4 text-primary" /> Pricing Variants
                                </h3>
                                {manageMode !== 'ADD_PRICING' && (
                                    <Button size="sm" onClick={() => { setManageMode('ADD_PRICING'); resetForm(); }} variant="outline" className="h-8 rounded-full">
                                        <Plus className="w-3 h-3 mr-1" /> Add Variant
                                    </Button>
                                )}
                            </div>

                            {/* ADD PRICING FORM */}
                            {manageMode === 'ADD_PRICING' && (
                                <div className="bg-muted/30 p-4 rounded-xl border border-dashed border-primary/30 animate-in fade-in zoom-in-95 duration-300">
                                    <h4 className="font-semibold text-sm mb-3 text-primary">New Pricing Variant</h4>
                                    <div className="space-y-3">
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-1">
                                                <Label className="text-xs">Quantity (e.g. 1kg)</Label>
                                                <Input value={qty} onChange={e => setQty(e.target.value)} className="h-8 bg-background" placeholder="Qty" />
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-xs">Price</Label>
                                                <Input type="number" value={price} onChange={e => setPrice(e.target.value)} className="h-8 bg-background" placeholder="0" />
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs">Discounted Price (Auto)</Label>
                                            <Input type="number" value={discountedPrice} onChange={e => setDiscountedPrice(e.target.value)} className="h-8 bg-background border-dashed" placeholder="Auto" />
                                        </div>
                                        <div className="flex gap-2 pt-2">
                                            <Button size="sm" onClick={() => createMutation.mutate()} disabled={createMutation.isPending} className="flex-1">
                                                {createMutation.isPending && <Loader2 className="w-3 h-3 mr-2 animate-spin" />} Save
                                            </Button>
                                            <Button size="sm" variant="ghost" onClick={() => setManageMode('VIEW')} className="flex-1">Cancel</Button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* PRICING LIST */}
                            <div className="space-y-3">
                                {pricingOptions.map((p: any) => (
                                    <div key={p.id} className="border rounded-xl p-0 overflow-hidden bg-card shadow-sm transition-all hover:shadow-md">
                                        <div
                                            className="p-3 flex items-center justify-between cursor-pointer hover:bg-muted/50 transition-colors"
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
                                                    </div>
                                                </div>
                                            </div>
                                            <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform duration-300 ${expandedPricingId === p.id ? 'rotate-90' : ''}`} />
                                        </div>

                                        {/* ADDONS SECTION (EXPANDED) */}
                                        {expandedPricingId === p.id && (
                                            <div className="bg-muted/20 border-t p-4 animate-in slide-in-from-top-2 duration-300">
                                                <div className="flex items-center justify-between mb-4">
                                                    <h5 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Addons</h5>
                                                    {manageMode !== 'ADD_ADDON' && (
                                                        <Button size="icon" variant="ghost" className="h-6 w-6 rounded-full hover:bg-primary/10 hover:text-primary" onClick={() => { setManageMode('ADD_ADDON'); resetForm(); }}>
                                                            <Plus className="w-4 h-4" />
                                                        </Button>
                                                    )}
                                                </div>

                                                {/* ADD ADDON FORM */}
                                                {manageMode === 'ADD_ADDON' && (
                                                    <div className="bg-background p-3 rounded-lg border mb-3 shadow-sm animate-in zoom-in-95">
                                                        <div className="space-y-3">
                                                            <div className="space-y-1">
                                                                <Label className="text-xs">Name</Label>
                                                                <Input value={name} onChange={e => setName(e.target.value)} className="h-7" placeholder="e.g. Extra Cheese" />
                                                            </div>
                                                            <div className="flex gap-3">
                                                                <div className="space-y-1 flex-1">
                                                                    <Label className="text-xs">Price</Label>
                                                                    <Input type="number" value={price} onChange={e => setPrice(e.target.value)} className="h-7" placeholder="10" />
                                                                </div>
                                                                <div className="pt-6 flex items-center space-x-2">
                                                                    <Checkbox id="man" checked={isMandatory} onCheckedChange={(c) => setIsMandatory(!!c)} />
                                                                    <Label htmlFor="man" className="text-xs">Mandatory</Label>
                                                                </div>
                                                            </div>
                                                            <div className="flex gap-2 pt-1">
                                                                <Button size="sm" onClick={() => createMutation.mutate()} disabled={createMutation.isPending} className="h-7 text-xs w-full">Save Addon</Button>
                                                                <Button size="sm" variant="ghost" onClick={() => setManageMode('VIEW')} className="h-7 text-xs w-full">Cancel</Button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="space-y-2">
                                                    {addonsLoading ? <div className="text-xs text-center py-2 text-muted-foreground">Loading addons...</div> :
                                                        addons.length === 0 ? <div className="text-xs text-center py-2 text-muted-foreground italic">No addons configured.</div> :
                                                            addons.map((addon: any) => (
                                                                <div key={addon.id} className="bg-background/80 border rounded p-2 flex justify-between items-center text-sm">
                                                                    <span>{addon.name}</span>
                                                                    <div className="flex items-center gap-2">
                                                                        {addon.mandatory && <span className="text-[10px] bg-red-100 text-red-600 px-1 rounded font-bold">REQ</span>}
                                                                        <span className="font-mono font-bold text-xs text-emerald-600">+₹{addon.price}</span>
                                                                    </div>
                                                                </div>
                                                            ))
                                                    }
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {pricingOptions.length === 0 && <div className="text-center py-8 text-muted-foreground text-sm">No pricing variants found. Add one to get started.</div>}
                            </div>
                        </div>
                    </SheetContent>
                </Sheet>
            </div>

            {renderBreadcrumbs()}

            {isLoading && <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}

            {!isLoading && (
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
                                    <Button size="icon" variant="ghost" className="h-6 w-6 hover:bg-muted" onClick={(e) => { e.stopPropagation(); toast({ description: "Coming soon" }); }}>
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
                                    {prod.productOffer && (
                                        <span className="text-[10px] bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                                            <Sparkles className="w-3 h-3" />
                                            {prod.productOffer}
                                        </span>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}

                    {/* LEVEL 3: PRICING */}
                    {level === 'PRICING' && pricingOptions.map((p: any) => (
                        <Card key={p.id}
                            className="cursor-pointer hover:border-primary/50 transition-all hover:shadow-md group"
                            onClick={() => { setSelectedPricing(p); setLevel('ADDON'); }}>
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

                    {/* LEVEL 4: ADDONS */}
                    {level === 'ADDON' && selectedPricing && (
                        addons.map((addon: any) => (
                            <Card key={addon.id} className="hover:border-border transition-all">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-base font-bold">{addon.name}</CardTitle>
                                    {addon.mandatory && <span className="text-[10px] bg-destructive/10 text-destructive px-1.5 py-0.5 rounded font-bold">MANDATORY</span>}
                                </CardHeader>
                                <CardContent>
                                    <div className="text-lg font-bold text-emerald-600">+₹{addon.price}</div>
                                </CardContent>
                            </Card>
                        ))
                    )}

                    {/* Empty States */}
                    {level === 'CATEGORY' && categories.length === 0 && <div className="col-span-3 text-center py-10 text-muted-foreground">No Categories found. Create one to get started.</div>}
                </div>
            )}
        </div>
    );
}
