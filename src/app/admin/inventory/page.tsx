'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { adminService } from "@/services/admin.service";
import { Category, Catalog, Product, ProductPriceOption } from "@/lib/types";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Loader2, Plus, Folder, Package, Tag, Layers, ChevronRight, Home
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
    const { companyId: tenantCompanyId } = useTenant();

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

    // --- FORM STATES ---
    const [name, setName] = useState("");
    const [desc, setDesc] = useState("");
    const [prodIng, setProdIng] = useState("");
    const [prodBest, setProdBest] = useState("");
    const [prodInst, setProdInst] = useState("");
    const [prodDeliveryCost, setProdDeliveryCost] = useState("40");
    const [isFamous, setIsFamous] = useState(false);
    const [price, setPrice] = useState("");
    const [qty, setQty] = useState("");
    const [isMandatory, setIsMandatory] = useState(false);
    const [image, setImage] = useState<string | null>(null);

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
                rating: 0
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
                quantity: p.productQuantity,
                addons: []
            }));
        }
    });

    // 5. Addons (Fetch addons only when Pricing is selected)
    const { data: addons = [], isLoading: addonsLoading } = useQuery({
        queryKey: ['addons', selectedPricing?.id],
        enabled: !!selectedPricing?.id,
        queryFn: async () => {
            const apiAddons = await adminService.getProductAddons(selectedPricing!.id);
            return apiAddons.map((a: any) => ({
                id: String(a.productAddonId),
                name: a.addonName,
                price: a.addonPrice,
                mandatory: a.mandatory
            }));
        }
    });



    // --- MUTATIONS ---
    const createMutation = useMutation({
        mutationFn: async () => {
            if (level === 'CATEGORY') {
                return adminService.createCategory({
                    companyId: companyId,
                    categoryName: name,
                    categoryDescription: desc,
                    categoryStatus: "ACTIVE",
                    categoryImage: image || undefined
                });
            } else if (level === 'CATALOGUE' && selectedCategory) {
                return adminService.createCatalogue({
                    categoryId: selectedCategory.id,
                    catalogueName: name,
                    catalogueDescription: desc,
                    catalogueImage: image || undefined
                });
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
                    productImage: image || undefined
                });
            } else if (level === 'PRICING' && selectedProduct) {
                return adminService.createPricing({
                    productId: Number(selectedProduct.id),
                    productPrice: Number(price),
                    productQuantity: qty
                });
            } else if (level === 'ADDON' && selectedPricing) {
                return adminService.createAddon({
                    productPricingId: Number(selectedPricing.id),
                    addonName: name,
                    addonPrice: Number(price),
                    mandatory: isMandatory,
                    active: true
                });
            }
        },
        onSuccess: () => {
            toast({ title: "Success", description: "Item created successfully" });
            setIsSheetOpen(false);
            resetForm();

            // Invalidate relevant queries to refresh list
            if (level === 'CATEGORY') queryClient.invalidateQueries({ queryKey: ['categories'] });
            if (level === 'CATALOGUE') queryClient.invalidateQueries({ queryKey: ['catalogues', selectedCategory?.id] });
            if (level === 'PRODUCT') queryClient.invalidateQueries({ queryKey: ['products', selectedCatalogue?.id] });
            if (level === 'PRICING') queryClient.invalidateQueries({ queryKey: ['pricing', selectedProduct?.id] });
            if (level === 'ADDON') queryClient.invalidateQueries({ queryKey: ['addons', selectedPricing?.id] });
        },
        onError: () => {
            toast({ title: "Error", description: "Failed to create item", variant: "destructive", duration: 2000 });
        }
    });

    // --- NAVIGATION HANDLERS ---
    const resetForm = () => {
        setName(""); setDesc(""); setProdIng(""); setProdBest(""); setProdInst("");
        setProdDeliveryCost("40"); setIsFamous(false); setPrice(""); setQty(""); setIsMandatory(false);
        setImage(null);
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
                                companyId={companyId}
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

                <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending} className="w-full mt-6">
                    {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create {level.charAt(0) + level.slice(1).toLowerCase()}
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
                            <SheetTitle>Add New {level.charAt(0) + level.slice(1).toLowerCase()}</SheetTitle>
                            <SheetDescription>
                                Create a new item in the current section.
                            </SheetDescription>
                        </SheetHeader>
                        {renderSheetForm()}
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
                                <Folder className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
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
                                <Layers className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                            </CardHeader>
                            <CardContent>
                                <p className="text-xs text-muted-foreground truncate">{catlg.products?.map((p: any) => p.name).join(', ')}</p>
                            </CardContent>
                        </Card>
                    ))}

                    {/* LEVEL 2: PRODUCTS */}
                    {level === 'PRODUCT' && products.map((prod: any) => (
                        <Card key={prod.id}
                            className="cursor-pointer hover:border-primary/50 transition-all hover:shadow-md group"
                            onClick={() => { setSelectedProduct(prod); setLevel('PRICING'); }}>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-base font-bold truncate">{prod.name}</CardTitle>
                                <Package className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                            </CardHeader>

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
                                <div className="text-2xl font-bold text-primary mb-2">₹{p.price}</div>
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
