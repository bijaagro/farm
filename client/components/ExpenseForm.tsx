import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  ExpenseRecord,
  ExpenseFormData,
  CategoryConfig,
} from "@shared/expense-types";
import * as api from "@/lib/api";

interface ExpenseFormProps {
  initialData?: ExpenseRecord;
  onSubmit: (expense: ExpenseRecord) => Promise<void> | void;
  onCancel: () => void;
  categories: string[];
  paidByOptions: string[];
  sourceOptions: string[];
}

// Default sub-categories for each category
const subCategoryMap: Record<string, string[]> = {
  "Food & Groceries": [
    "Monthly Groceries",
    "Fresh Vegetables",
    "Fruits",
    "Dairy Products",
    "Spices & Condiments",
  ],
  "Food & Dining": [
    "Cafe & Restaurants",
    "Family Dining",
    "Street Food",
    "Sweets",
    "Fast Food",
  ],
  Transportation: [
    "Fuel",
    "Auto Rickshaw",
    "Bus/Metro",
    "Taxi/Cab",
    "Vehicle Maintenance",
  ],
  Utilities: ["Electricity", "Water", "Gas", "Internet", "Mobile Recharge"],
  Entertainment: ["Movies", "Streaming Services", "Games", "Books", "Music"],
  Healthcare: [
    "Doctor Consultation",
    "Medicines",
    "Dental",
    "Health Insurance",
    "Medical Tests",
  ],
  Education: [
    "School Fees",
    "Books",
    "Online Learning",
    "Tuition",
    "Stationery",
  ],
  Insurance: [
    "Vehicle Insurance",
    "Health Insurance",
    "Life Insurance",
    "Home Insurance",
  ],
  "Health & Fitness": [
    "Gym Membership",
    "Sports",
    "Yoga Classes",
    "Health Supplements",
  ],
  Shopping: [
    "Clothing",
    "Electronics",
    "Online Shopping",
    "Household Items",
    "Gifts",
  ],
  Salary: ["Monthly Salary", "Overtime", "DA/HRA", "Special Allowances"],
  "Freelance Income": [
    "Web Development",
    "Design",
    "Consulting",
    "Content Writing",
  ],
  "Investment Income": [
    "FD Interest",
    "Share Dividends",
    "Mutual Funds",
    "PPF Interest",
  ],
  "Rental Income": ["House Rent", "Shop Rent", "Vehicle Rent"],
  Bonus: ["Performance Bonus", "Festival Bonus", "Commission", "Incentives"],

  // Business-specific categories
  Power: ["General", "Line Work", "Electrical Equipment", "Maintenance"],
  PreCast: ["General", "Materials", "Labor", "Transportation"],
  Water: ["General", "Borewell", "Motor", "Plumbing", "Maintenance"],
  Land: [
    "General",
    "Survey",
    "Registration",
    "Development",
    "Misc",
    "Iron Work",
  ],
  Business: [
    "General",
    "GoatB-Care",
    "GoatB-Misc",
    "GoatB-Shed",
    "GoatB-Vet",
    "GoatB-feed",
    "GoatB-goatpurchase",
    "GoatB-machinary",
    "Misc",
    "PoultryB-Product",
    "agri",
    "farming",
    "harvest pit",
    "watchmen",
  ],
  Rooms: [
    "General",
    "Precast",
    "Iron Work",
    "Plumbing",
    "Cement Work",
    "Flooring",
    "Electric",
    "Painting Work",
    "Kitchen",
    "Doors",
    "Solar",
    "Furniture",
    "Misc",
  ],
  Misc: ["General", "Food & Dining", "Others"],
};

export function ExpenseForm({
  initialData,
  onSubmit,
  onCancel,
  categories,
  paidByOptions,
  sourceOptions,
}: ExpenseFormProps) {
  const [formData, setFormData] = useState<ExpenseFormData>({
    date: initialData?.date || new Date().toISOString().split("T")[0],
    type: initialData?.type || "Expense",
    description: initialData?.description || "",
    amount: initialData?.amount?.toString() || "",
    paidBy: initialData?.paidBy || "",
    category: initialData?.category || "",
    subCategory: initialData?.subCategory || "",
    source: initialData?.source || "",
    notes: initialData?.notes || "",
  });

  const [availableSubCategories, setAvailableSubCategories] = useState<
    string[]
  >([]);
  const [dynamicCategories, setDynamicCategories] = useState<CategoryConfig[]>(
    [],
  );
  const [newCategory, setNewCategory] = useState("");
  const [newPaidBy, setNewPaidBy] = useState("");
  const [newSource, setNewSource] = useState("");
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [showNewPaidByInput, setShowNewPaidByInput] = useState(false);
  const [showNewSourceInput, setShowNewSourceInput] = useState(false);

  // Load dynamic categories from API
  useEffect(() => {
    const loadDynamicCategories = async () => {
      try {
        const categoryData = await api.fetchCategories();
        setDynamicCategories(categoryData.categories || []);
      } catch (error) {
        console.error("Error loading categories:", error);
        // Fallback to existing categories from props
        setDynamicCategories([]);
      }
    };
    loadDynamicCategories();
  }, []);

  // Update sub-categories when category changes
  useEffect(() => {
    let subCategories: string[] = [];

    // First check dynamic categories
    const dynamicCategory = dynamicCategories.find(
      (cat) => cat.name === formData.category,
    );
    if (dynamicCategory) {
      subCategories = dynamicCategory.subCategories;
    } else if (formData.category && subCategoryMap[formData.category]) {
      // Fallback to static categories
      subCategories = subCategoryMap[formData.category];
    }

    setAvailableSubCategories(subCategories);

    // Clear sub-category if it doesn't exist in the new list
    if (
      subCategories.length > 0 &&
      !subCategories.includes(formData.subCategory)
    ) {
      setFormData((prev) => ({ ...prev, subCategory: "" }));
    }
  }, [formData.category, dynamicCategories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.description || !formData.amount || !formData.category) {
      return;
    }

    const finalCategory =
      showNewCategoryInput && newCategory ? newCategory : formData.category;
    const finalPaidBy =
      showNewPaidByInput && newPaidBy ? newPaidBy : formData.paidBy;
    const finalSource =
      showNewSourceInput && newSource ? newSource : formData.source;

    const expense: ExpenseRecord = {
      id: initialData?.id || Date.now().toString(),
      date: formData.date,
      type: formData.type,
      description: formData.description,
      amount: parseFloat(formData.amount),
      paidBy: finalPaidBy,
      category: finalCategory,
      subCategory: formData.subCategory,
      source: finalSource,
      notes: formData.notes,
    };

    await onSubmit(expense);
  };

  const handleCategoryChange = (value: string) => {
    if (value === "new") {
      setShowNewCategoryInput(true);
      setFormData((prev) => ({ ...prev, category: "" }));
    } else {
      setShowNewCategoryInput(false);
      setFormData((prev) => ({ ...prev, category: value }));
    }
  };

  const handlePaidByChange = (value: string) => {
    if (value === "new") {
      setShowNewPaidByInput(true);
      setFormData((prev) => ({ ...prev, paidBy: "" }));
    } else {
      setShowNewPaidByInput(false);
      setFormData((prev) => ({ ...prev, paidBy: value }));
    }
  };

  const handleSourceChange = (value: string) => {
    if (value === "new") {
      setShowNewSourceInput(true);
      setFormData((prev) => ({ ...prev, source: "" }));
    } else {
      setShowNewSourceInput(false);
      setFormData((prev) => ({ ...prev, source: value }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Type Selection */}
      <div className="space-y-2">
        <Label>Transaction Type</Label>
        <RadioGroup
          value={formData.type}
          onValueChange={(value: "Income" | "Expense") =>
            setFormData((prev) => ({ ...prev, type: value }))
          }
          className="flex space-x-4"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="Expense" id="expense" />
            <Label htmlFor="expense">Expense</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="Income" id="income" />
            <Label htmlFor="income">Income</Label>
          </div>
        </RadioGroup>
      </div>

      {/* Date */}
      <div className="space-y-2">
        <Label htmlFor="date">Date *</Label>
        <Input
          id="date"
          type="date"
          value={formData.date}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, date: e.target.value }))
          }
          required
        />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Description *</Label>
        <Input
          id="description"
          value={formData.description}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, description: e.target.value }))
          }
          placeholder="Enter transaction description"
          required
        />
      </div>

      {/* Amount */}
      <div className="space-y-2">
        <Label htmlFor="amount">Amount *</Label>
        <Input
          id="amount"
          type="number"
          step="0.01"
          min="0"
          value={formData.amount}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, amount: e.target.value }))
          }
          placeholder="0.00"
          required
        />
      </div>

      {/* Category */}
      <div className="space-y-2">
        <Label>Category *</Label>
        {showNewCategoryInput ? (
          <div className="flex space-x-2">
            <Input
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="Enter new category"
              className="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowNewCategoryInput(false)}
            >
              Cancel
            </Button>
          </div>
        ) : (
          <Select
            value={formData.category || undefined}
            onValueChange={handleCategoryChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
              <SelectItem value="new">+ Add New Category</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Sub-Category */}
      <div className="space-y-2">
        <Label>Sub-Category</Label>
        {availableSubCategories.length > 0 ? (
          <Select
            value={formData.subCategory || undefined}
            onValueChange={(value) =>
              setFormData((prev) => ({ ...prev, subCategory: value }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select sub-category" />
            </SelectTrigger>
            <SelectContent>
              {availableSubCategories.map((subCategory) => (
                <SelectItem key={subCategory} value={subCategory}>
                  {subCategory}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Input
            value={formData.subCategory}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, subCategory: e.target.value }))
            }
            placeholder="Enter sub-category"
          />
        )}
      </div>

      {/* Paid By */}
      <div className="space-y-2">
        <Label>Paid By</Label>
        {showNewPaidByInput ? (
          <div className="flex space-x-2">
            <Input
              value={newPaidBy}
              onChange={(e) => setNewPaidBy(e.target.value)}
              placeholder="Enter new payer"
              className="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowNewPaidByInput(false)}
            >
              Cancel
            </Button>
          </div>
        ) : (
          <Select
            value={formData.paidBy || undefined}
            onValueChange={handlePaidByChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select who paid" />
            </SelectTrigger>
            <SelectContent>
              {paidByOptions.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
              <SelectItem value="new">+ Add New Payer</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Source */}
      <div className="space-y-2">
        <Label>Source</Label>
        {showNewSourceInput ? (
          <div className="flex space-x-2">
            <Input
              value={newSource}
              onChange={(e) => setNewSource(e.target.value)}
              placeholder="Enter new source"
              className="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowNewSourceInput(false)}
            >
              Cancel
            </Button>
          </div>
        ) : (
          <Select
            value={formData.source || undefined}
            onValueChange={handleSourceChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select payment source" />
            </SelectTrigger>
            <SelectContent>
              {sourceOptions.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
              <SelectItem value="new">+ Add New Source</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, notes: e.target.value }))
          }
          placeholder="Additional notes (optional)"
          rows={3}
        />
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
          {initialData ? "Update" : "Add"} Transaction
        </Button>
      </div>
    </form>
  );
}
