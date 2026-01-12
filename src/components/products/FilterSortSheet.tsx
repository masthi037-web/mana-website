import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter, SheetClose } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { RotateCcw, SlidersHorizontal } from "lucide-react";
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";

export type FilterState = {
    sortBy: 'recommended' | 'price_asc' | 'price_desc' | 'rating_desc' | 'newest';
    priceRange: [number, number];
    minRating: number | null;
};

interface FilterSortSheetProps {
    onApply: (filters: FilterState) => void;
    currentFilters: FilterState;
    minPrice?: number;
    maxPrice?: number;
}

export function FilterSortSheet({ onApply, currentFilters, minPrice = 0, maxPrice = 1000 }: FilterSortSheetProps) {
    const [filters, setFilters] = useState<FilterState>(currentFilters);

    // Sync local state when props change
    useEffect(() => {
        setFilters(currentFilters);
    }, [currentFilters]);

    const handleReset = () => {
        const resetState: FilterState = {
            sortBy: 'recommended',
            priceRange: [minPrice, maxPrice],
            minRating: null
        };
        setFilters(resetState);
    };

    const handleApply = () => {
        onApply(filters);
    };

    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="outline" className="rounded-full border-border/50 shadow-sm hover:shadow-md bg-background hover:bg-secondary/20 px-4 h-9 transition-all text-foreground font-medium flex items-center gap-2 text-sm">
                    <SlidersHorizontal className="w-4 h-4" />
                    Filter & Sort
                </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[85vh] sm:h-auto sm:rounded-t-3xl overflow-y-auto">
                <SheetHeader className="mb-6">
                    <SheetTitle className="text-center text-xl font-headline">Filter & Sort</SheetTitle>
                </SheetHeader>

                <div className="space-y-8 pb-20">
                    {/* Sort By */}
                    <div className="space-y-4">
                        <h4 className="font-semibold text-lg">Sort By</h4>
                        <RadioGroup
                            value={filters.sortBy}
                            onValueChange={(val) => setFilters({ ...filters, sortBy: val as any })}
                            className="grid grid-cols-1 gap-3"
                        >
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="recommended" id="sort-recommended" />
                                <Label htmlFor="sort-recommended" className="flex-1 cursor-pointer py-1">Recommended</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="newest" id="sort-newest" />
                                <Label htmlFor="sort-newest" className="flex-1 cursor-pointer py-1">Newest Arrivals</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="rating_desc" id="sort-rating" />
                                <Label htmlFor="sort-rating" className="flex-1 cursor-pointer py-1">Customer Rating</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="price_asc" id="sort-price-asc" />
                                <Label htmlFor="sort-price-asc" className="flex-1 cursor-pointer py-1">Price: Low to High</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="price_desc" id="sort-price-desc" />
                                <Label htmlFor="sort-price-desc" className="flex-1 cursor-pointer py-1">Price: High to Low</Label>
                            </div>
                        </RadioGroup>
                    </div>

                    <Separator />

                    {/* Price Range */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h4 className="font-semibold text-lg">Price Range</h4>
                            <span className="text-sm font-medium text-muted-foreground">
                                ₹{filters.priceRange[0]} - ₹{filters.priceRange[1]}
                            </span>
                        </div>
                        <Slider
                            defaultValue={[minPrice, maxPrice]}
                            value={[filters.priceRange[0], filters.priceRange[1]]}
                            min={minPrice}
                            max={maxPrice}
                            step={10}
                            onValueChange={(val) => setFilters({ ...filters, priceRange: [val[0], val[1]] })}
                            className="py-4"
                        />
                    </div>

                    <Separator />

                    {/* Rating */}
                    <div className="space-y-4">
                        <h4 className="font-semibold text-lg">Customer Ratings</h4>
                        <div className="flex flex-wrap gap-2">
                            {[4, 3, 2, 1].map((rating) => (
                                <Badge
                                    key={rating}
                                    variant={filters.minRating === rating ? "default" : "outline"}
                                    className="cursor-pointer px-4 py-2 text-sm rounded-full transition-all"
                                    onClick={() => setFilters({ ...filters, minRating: filters.minRating === rating ? null : rating })}
                                >
                                    {rating}+ Stars
                                </Badge>
                            ))}
                        </div>
                    </div>
                </div>

                <SheetFooter className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-border flex flex-row gap-3 sm:static sm:p-0 sm:bg-transparent sm:border-0 sm:mt-8">
                    <Button variant="outline" className="flex-1 rounded-full h-12" onClick={handleReset}>
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Reset
                    </Button>
                    <SheetClose asChild>
                        <Button className="flex-1 rounded-full h-12" onClick={handleApply}>
                            Apply Filters
                        </Button>
                    </SheetClose>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
