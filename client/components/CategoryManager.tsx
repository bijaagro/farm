import { useState, useEffect } from "react";
import { Plus, Trash2, Edit3, Save, X, Settings, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { CategoryConfig } from "@shared/expense-types";
import * as api from "@/lib/api";

interface CategoryManagerProps {
  onCategoriesUpdate: () => void;
}

export function CategoryManager({ onCategoriesUpdate }: CategoryManagerProps) {
  const [categories, setCategories] = useState<CategoryConfig[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editingSubCategory, setEditingSubCategory] = useState<{
    categoryId: string;
    index: number;
  } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{
    type: "category" | "subCategory";
    categoryId: string;
    subCategoryIndex?: number;
  } | null>(null);

  const [newCategoryName, setNewCategoryName] = useState("");
  const [newSubCategoryName, setNewSubCategoryName] = useState("");
  const [editValue, setEditValue] = useState("");

  const { toast } = useToast();

  const loadCategories = async () => {
    try {
      setLoading(true);
      const categoryData = await api.fetchCategories();
      setCategories(categoryData.categories || []);
    } catch (error) {
      console.error("Error loading categories:", error);
      toast({
        title: "Error",
        description: "Failed to load categories",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePopulateCategories = async () => {
    try {
      setLoading(true);
      const result = await api.populateCategories();
      setCategories(result.categories.categories || []);
      onCategoriesUpdate();

      toast({
        title: "Success",
        description: `Successfully populated ${result.count} categories from existing expense data`,
      });
    } catch (error) {
      console.error("Error populating categories:", error);
      toast({
        title: "Error",
        description: "Failed to populate categories from expense data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadCategories();
    }
  }, [isOpen]);

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;

    try {
      const newCategory: CategoryConfig = {
        id: Date.now().toString(),
        name: newCategoryName.trim(),
        subCategories: [],
        createdAt: new Date().toISOString(),
      };

      await api.saveCategories({
        categories: [...categories, newCategory],
        lastUpdated: new Date().toISOString(),
      });

      setCategories([...categories, newCategory]);
      setNewCategoryName("");
      onCategoriesUpdate();

      toast({
        title: "Success",
        description: "Category added successfully",
      });
    } catch (error) {
      console.error("Error adding category:", error);
      toast({
        title: "Error",
        description: "Failed to add category",
        variant: "destructive",
      });
    }
  };

  const handleAddSubCategory = async (categoryId: string) => {
    if (!newSubCategoryName.trim()) return;

    try {
      const updatedCategories = categories.map((category) => {
        if (category.id === categoryId) {
          return {
            ...category,
            subCategories: [
              ...category.subCategories,
              newSubCategoryName.trim(),
            ],
          };
        }
        return category;
      });

      await api.saveCategories({
        categories: updatedCategories,
        lastUpdated: new Date().toISOString(),
      });

      setCategories(updatedCategories);
      setNewSubCategoryName("");
      onCategoriesUpdate();

      toast({
        title: "Success",
        description: "Sub-category added successfully",
      });
    } catch (error) {
      console.error("Error adding sub-category:", error);
      toast({
        title: "Error",
        description: "Failed to add sub-category",
        variant: "destructive",
      });
    }
  };

  const handleEditCategory = async (categoryId: string) => {
    if (!editValue.trim()) return;

    try {
      const updatedCategories = categories.map((category) => {
        if (category.id === categoryId) {
          return { ...category, name: editValue.trim() };
        }
        return category;
      });

      await api.saveCategories({
        categories: updatedCategories,
        lastUpdated: new Date().toISOString(),
      });

      setCategories(updatedCategories);
      setEditingCategory(null);
      setEditValue("");
      onCategoriesUpdate();

      toast({
        title: "Success",
        description: "Category updated successfully",
      });
    } catch (error) {
      console.error("Error updating category:", error);
      toast({
        title: "Error",
        description: "Failed to update category",
        variant: "destructive",
      });
    }
  };

  const handleEditSubCategory = async (
    categoryId: string,
    subCategoryIndex: number,
  ) => {
    if (!editValue.trim()) return;

    try {
      const updatedCategories = categories.map((category) => {
        if (category.id === categoryId) {
          const newSubCategories = [...category.subCategories];
          newSubCategories[subCategoryIndex] = editValue.trim();
          return { ...category, subCategories: newSubCategories };
        }
        return category;
      });

      await api.saveCategories({
        categories: updatedCategories,
        lastUpdated: new Date().toISOString(),
      });

      setCategories(updatedCategories);
      setEditingSubCategory(null);
      setEditValue("");
      onCategoriesUpdate();

      toast({
        title: "Success",
        description: "Sub-category updated successfully",
      });
    } catch (error) {
      console.error("Error updating sub-category:", error);
      toast({
        title: "Error",
        description: "Failed to update sub-category",
        variant: "destructive",
      });
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    try {
      const updatedCategories = categories.filter(
        (category) => category.id !== categoryId,
      );

      await api.saveCategories({
        categories: updatedCategories,
        lastUpdated: new Date().toISOString(),
      });

      setCategories(updatedCategories);
      setDeleteTarget(null);
      onCategoriesUpdate();

      toast({
        title: "Success",
        description: "Category deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting category:", error);
      toast({
        title: "Error",
        description: "Failed to delete category",
        variant: "destructive",
      });
    }
  };

  const handleDeleteSubCategory = async (
    categoryId: string,
    subCategoryIndex: number,
  ) => {
    try {
      const updatedCategories = categories.map((category) => {
        if (category.id === categoryId) {
          const newSubCategories = category.subCategories.filter(
            (_, index) => index !== subCategoryIndex,
          );
          return { ...category, subCategories: newSubCategories };
        }
        return category;
      });

      await api.saveCategories({
        categories: updatedCategories,
        lastUpdated: new Date().toISOString(),
      });

      setCategories(updatedCategories);
      setDeleteTarget(null);
      onCategoriesUpdate();

      toast({
        title: "Success",
        description: "Sub-category deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting sub-category:", error);
      toast({
        title: "Error",
        description: "Failed to delete sub-category",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
            <Settings className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Manage Categories</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Categories & Sub-Categories</DialogTitle>
            <DialogDescription>
              Add, edit, or delete categories and their sub-categories used in
              your expense tracker.
            </DialogDescription>
          </DialogHeader>

          {/* Populate from existing data */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Category Management</CardTitle>
                <Button
                  onClick={handlePopulateCategories}
                  disabled={loading}
                  variant="outline"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Populate from Expenses
                </Button>
              </div>
              <CardDescription>
                Populate categories from existing expense data or add new ones
                manually
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Add New Category */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Add New Category</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Enter category name"
                  onKeyPress={(e) => e.key === "Enter" && handleAddCategory()}
                />
                <Button
                  onClick={handleAddCategory}
                  disabled={!newCategoryName.trim()}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Categories List */}
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-slate-600">Loading categories...</p>
              </div>
            ) : categories.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-slate-500">
                    No categories found. Add your first category above.
                  </p>
                </CardContent>
              </Card>
            ) : (
              categories.map((category) => (
                <Card key={category.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      {editingCategory === category.id ? (
                        <div className="flex items-center gap-2 flex-1">
                          <Input
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyPress={(e) =>
                              e.key === "Enter" &&
                              handleEditCategory(category.id)
                            }
                            className="flex-1"
                          />
                          <Button
                            size="sm"
                            onClick={() => handleEditCategory(category.id)}
                          >
                            <Save className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingCategory(null);
                              setEditValue("");
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <>
                          <CardTitle className="text-lg">
                            {category.name}
                          </CardTitle>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingCategory(category.id);
                                setEditValue(category.name);
                              }}
                            >
                              <Edit3 className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                setDeleteTarget({
                                  type: "category",
                                  categoryId: category.id,
                                })
                              }
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* Sub-categories */}
                    <div className="space-y-3">
                      <Label>Sub-Categories:</Label>
                      <div className="flex flex-wrap gap-2">
                        {category.subCategories.map((subCategory, index) => (
                          <div key={index} className="flex items-center gap-1">
                            {editingSubCategory?.categoryId === category.id &&
                            editingSubCategory.index === index ? (
                              <div className="flex items-center gap-1">
                                <Input
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  onKeyPress={(e) =>
                                    e.key === "Enter" &&
                                    handleEditSubCategory(category.id, index)
                                  }
                                  className="w-32"
                                  size="sm"
                                />
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    handleEditSubCategory(category.id, index)
                                  }
                                >
                                  <Save className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setEditingSubCategory(null);
                                    setEditValue("");
                                  }}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            ) : (
                              <Badge
                                variant="secondary"
                                className="cursor-pointer group"
                              >
                                <span>{subCategory}</span>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-4 w-4 p-0 ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={() => {
                                    setEditingSubCategory({
                                      categoryId: category.id,
                                      index,
                                    });
                                    setEditValue(subCategory);
                                  }}
                                >
                                  <Edit3 className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-4 w-4 p-0 ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={() =>
                                    setDeleteTarget({
                                      type: "subCategory",
                                      categoryId: category.id,
                                      subCategoryIndex: index,
                                    })
                                  }
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Add sub-category */}
                      <div className="flex gap-2">
                        <Input
                          value={newSubCategoryName}
                          onChange={(e) =>
                            setNewSubCategoryName(e.target.value)
                          }
                          placeholder="Add sub-category"
                          onKeyPress={(e) =>
                            e.key === "Enter" &&
                            handleAddSubCategory(category.id)
                          }
                          size="sm"
                        />
                        <Button
                          size="sm"
                          onClick={() => handleAddSubCategory(category.id)}
                          disabled={!newSubCategoryName.trim()}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the{" "}
              {deleteTarget?.type}.
              {deleteTarget?.type === "category" &&
                " All associated sub-categories will also be deleted."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteTarget?.type === "category") {
                  handleDeleteCategory(deleteTarget.categoryId);
                } else if (
                  deleteTarget?.type === "subCategory" &&
                  deleteTarget.subCategoryIndex !== undefined
                ) {
                  handleDeleteSubCategory(
                    deleteTarget.categoryId,
                    deleteTarget.subCategoryIndex,
                  );
                }
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
