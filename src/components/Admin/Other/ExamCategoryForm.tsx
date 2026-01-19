import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Trash2, Pencil, Plus, X, ChevronRight } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import section_name from "@/tempdata/section_names.json";

type SectionNames = {
  [key: string]: { name: string; instruction: string }[];
};
// import { log } from "console";

const ExamManagement = () => {
  const section_names: Record<string, { name: string; instruction: string }[]> =
    section_name;
  // console.log(section_names);
  const [categories, setCategories] = useState<
    {
      id: string;
      name: string;
      description: string;
      eligibility: string;
      cutoffs: string;
      examPattern: string;
      subjects: { id: string; name: string }[];
    }[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [editingCategory, setEditingCategory] = useState<{ id: string } | null>(
    null
  );
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    description: "",
    eligibility: "",
    cutoffs: "",
    examPattern: "",
    subjectIds: [] as string[],
  });
  const [sections, setSections] = useState<{
    [key: string]: {
      id: string;
      name: string;
      description: string;
      examCategoryId: string;
      fullMarks: number;
      negativeMarks: number;
      zeroMarks: number;
      partialMarks: number[];
    }[];
  }>({});
  const [activeCategory, setActiveCategory] = useState<[string, string] | null>(
    null
  );
  const [showSectionForm, setShowSectionForm] = useState(false);
  type SectionFormData = {
    name: string;
    description: string;
    examCategoryId: string;
    fullMarks: number;
    negativeMarks: number;
    zeroMarks: number;
    partialMarks: number[];
  };
  const [sectionFormData, setSectionFormData] = useState<SectionFormData>({
    name: "",
    description: "",
    examCategoryId: "",
    fullMarks: 0,
    negativeMarks: 0,
    zeroMarks: 0,
    partialMarks: [],
  });
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [loadingCategories, setloadingCategories] = useState(false);
  const [loadingSections, setloadingSections] = useState(false);
  const [subjects, setSubjects] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    fetchCategories();
    fetchSubjects();
  }, []);

  const fetchCategories = async () => {
    try {
      setloadingCategories(true);
      const response = await fetch("/api/v1/exam-categories");
      const data = await response.json();
      // setCategories(data.data);
      setCategories(
        data.data
          ? data.data
          : [
              {
                examPattern: "NA",
                description: "NA",
                id: "NA",
                name: "NA",
                eligibility: "NA",
                cutoffs: "NA",
                subjects: ["NA", "NA"],
              },
            ]
      );
    } catch (err) {
      setError("Failed to fetch categories");
    } finally {
      setloadingCategories(false);
    }
  };

  const fetchSubjects = async () => {
    try {
      const response = await fetch("/api/v1/subjects");
      const data = await response.json();
      setSubjects(data.data);
    } catch (err) {
      setError("Failed to fetch subjects");
      console.log(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const url = editingCategory
        ? `/api/v1/exam-categories/${editingCategory.id}`
        : "/api/v1/exam-categories";

      const { id, ...dataToSubmit } = formData; // Exclude ID

      // Make sure only subjectIds is included in payload
      const payload = {
        ...dataToSubmit,
        // Don't include subjects here
      };
      // console.log(dataToSubmit);

      console.log("Submitting Data: ", payload);

      const response = await fetch(url, {
        method: editingCategory ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Failed to save category");

      await fetchCategories();
      resetForm();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/v1/exam-categories/${id}`, { method: "DELETE" });
      await fetchCategories();
    } catch (err) {
      setError("Failed to delete category");
    }
  };

  const handleEdit = (category: {
    id: string;
    name: string;
    description: string;
    eligibility: string;
    cutoffs: string;
    examPattern: string;
    subjectIds: string[];
  }) => {
    setEditingCategory(category);

    setFormData({
      id: category.id,
      name: category.name,
      description: category.description,
      eligibility: category.eligibility,
      cutoffs: category.cutoffs,
      examPattern: category.examPattern,
      subjectIds: category.subjectIds,
    });
    // console.log("Editing Category: ", category);

    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      id: "",
      name: "",
      description: "",
      eligibility: "",
      cutoffs: "",
      examPattern: "",
      subjectIds: [],
    });
    setEditingCategory(null);
    setShowForm(false);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const fetchSections = async (categoryId: string) => {
    try {
      setloadingSections(true);
      const response = await fetch(
        `/api/v1/exam-categories/${categoryId}/section-configs`
      );
      const data = await response.json();
      setSections((prev) => ({
        ...prev,
        [categoryId]: data.data,
      }));
    } catch (err) {
      setError("Failed to fetch sections");
    } finally {
      setloadingSections(false);
    }
  };

  const handleSectionSubmit = async (
    e: React.FormEvent<HTMLFormElement>,
    categoryId: string
  ) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const url = editingSectionId
        ? `/api/v1/section-configs/${editingSectionId}`
        : `/api/v1/section-configs`;
      const method = editingSectionId ? "PATCH" : "POST";

      await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...sectionFormData,
          examCategoryId: categoryId,
        }),
      });

      await fetchSections(categoryId);
      resetSectionForm();
    } catch (err) {
      setError(
        editingSectionId ? "Failed to update section" : "Failed to add section"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const resetSectionForm = () => {
    setSectionFormData({
      name: "",
      description: "",
      examCategoryId: "",
      fullMarks: 0,
      negativeMarks: 0,
      zeroMarks: 0,
      partialMarks: [],
    });
    setEditingSectionId(null);
    setShowSectionForm(false);
  };

  const toggleCategory = (categoryId: string, name: string) => {
    if (activeCategory && activeCategory[0] === categoryId) {
      setActiveCategory(null);
    } else {
      setActiveCategory([categoryId, name]);
      fetchSections(categoryId);
    }
  };

  const handleEditSection = (section: {
    id: string;
    name: string;
    description: string;
    examCategoryId: string;
    fullMarks: number;
    negativeMarks: number;
    zeroMarks: number;
    partialMarks: number[];
  }) => {
    setEditingSectionId(section.id);
    setSectionFormData({
      name: section.name,
      description: section.description,
      examCategoryId: section.examCategoryId,
      fullMarks: section.fullMarks,
      negativeMarks: section.negativeMarks,
      zeroMarks: section.zeroMarks,
      partialMarks: section.partialMarks,
    });
    setShowSectionForm(true);
  };

  const handleDeleteSection = async (sectionId: string) => {
    setIsLoading(true);
    try {
      await fetch(`/api/v1/section-configs/${sectionId}`, {
        method: "DELETE",
      });
      await fetchSections(activeCategory![0]);
    } catch (err) {
      setError("Failed to delete section");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Exam Categories</h1>
        <Button onClick={() => setShowForm(!showForm)} size="sm">
          {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingCategory ? "Edit Category" : "Add Category"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                name="name"
                placeholder="Name"
                value={formData.name}
                onChange={handleChange}
                required
              />
              <Textarea
                name="description"
                placeholder="Description"
                value={formData.description}
                onChange={handleChange}
                required
              />
              <Input
                name="eligibility"
                placeholder="Eligibility"
                value={formData.eligibility}
                onChange={handleChange}
                required
              />
              <div className="flex gap-4 lg:flex-row flex-col">
                <Input
                  name="cutoffs"
                  placeholder="Cutoffs"
                  value={formData.cutoffs}
                  onChange={handleChange}
                  required
                />
                <Input
                  name="examPattern"
                  placeholder="Exam Pattern"
                  value={formData.examPattern}
                  onChange={handleChange}
                  required
                />
              </div>
              <Label htmlFor="subjectIds">Subject</Label>
              <div className="flex flex-wrap gap-4 lg:flex-row flex-col">
                {subjects.map((subject) => (
                  <div key={subject.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`subject-${subject.id}`}
                      checked={formData.subjectIds.some(
                        (s) => s === subject.id
                      )}
                      onCheckedChange={(checked) => {
                        setFormData((prev) => {
                          if (checked) {
                            // Add subject if checked
                            return {
                              ...prev,
                              subjectIds: [...prev.subjectIds, subject.id],
                            };
                          } else {
                            // Remove subject if unchecked
                            return {
                              ...prev,
                              subjectIds: prev.subjectIds.filter(
                                (s) => s !== subject.id
                              ),
                            };
                          }
                        });
                      }}
                    />
                    <Label htmlFor={`subject-${subject.id}`}>
                      {subject.name}
                    </Label>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={isLoading}>
                  {isLoading
                    ? "Saving..."
                    : editingCategory
                    ? "Update"
                    : "Create"}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8"></TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Eligibility</TableHead>
                <TableHead>Cutoffs</TableHead>
                <TableHead>Pattern</TableHead>
                <TableHead>Subjects</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadingCategories && (
                <TableRow>
                  <TableCell colSpan={7} className="p-4">
                    Loading Categories...
                  </TableCell>
                </TableRow>
              )}
              {!loadingCategories && categories.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="p-4">
                    No Categories Found!
                  </TableCell>
                </TableRow>
              )}
              {categories.map((category) => (
                <React.Fragment key={category.id}>
                  <TableRow key={category.id}>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="drop"
                        onClick={() =>
                          toggleCategory(category.id, category.name)
                        }
                      >
                        <ChevronRight
                          className={`h-4 w-4 transition-transform duration-300 ease-in-out ${
                            activeCategory && activeCategory[0] === category.id
                              ? "rotate-90"
                              : ""
                          }`}
                        />
                      </Button>
                    </TableCell>
                    <TableCell>{category.name}</TableCell>
                    <TableCell>{category.description}</TableCell>
                    <TableCell>{category.eligibility}</TableCell>
                    <TableCell>{category.cutoffs}</TableCell>
                    <TableCell>{category.examPattern}</TableCell>
                    <TableCell>
                      {category.subjects
                        .map((subject) => subject.name)
                        .join(", ")}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="icon"
                          variant="edit"
                          onClick={() =>
                            handleEdit({
                              ...category,
                              subjectIds: category.subjects.map(
                                (subject) => subject.id
                              ),
                            })
                          }
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="destructive"
                          onClick={() => handleDelete(category.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  {activeCategory && activeCategory[0] === category.id && (
                    <TableRow>
                      <TableCell colSpan={8}>
                        <div className="p-4 space-y-4">
                          <div className="flex justify-between items-center">
                            <h3 className="font-semibold">Sections</h3>
                            <Button
                              size="sm"
                              onClick={() =>
                                setShowSectionForm(!showSectionForm)
                              }
                            >
                              {showSectionForm ? (
                                <X className="h-4 w-4" />
                              ) : (
                                <Plus className="h-4 w-4" />
                              )}
                            </Button>
                          </div>

                          {showSectionForm && (
                            <Card>
                              <CardContent className="p-4">
                                <form
                                  onSubmit={(e) =>
                                    handleSectionSubmit(e, category.id)
                                  }
                                  className="space-y-4"
                                >
                                  {/* <Input
                                    name="name"
                                    placeholder="Section Name"
                                    value={sectionFormData.name}
                                    onChange={(e) =>
                                      setSectionFormData((prev) => ({
                                        ...prev,
                                        name: e.target.value,
                                      }))
                                    }
                                    required
                                  /> */}
                                  <div className="flex-1">
                                    <Label htmlFor="name">Section Name</Label>
                                    <Select
                                      name="name"
                                      value={sectionFormData.name}
                                      onValueChange={(value) => {
                                        setSectionFormData((prev) => ({
                                          ...prev,
                                          name: value,
                                          description:
                                            section_names[
                                              activeCategory[1].toLowerCase()
                                            ]?.find(
                                              (section) =>
                                                section.name === value
                                            )?.instruction || "",
                                        }));
                                      }}
                                    >
                                      <SelectTrigger>
                                        <SelectValue placeholder="Section Name" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {section_names[
                                          activeCategory[1].toLowerCase()
                                        ]?.map((section) => (
                                          <SelectItem
                                            key={section.name}
                                            value={section.name}
                                          >
                                            {section.name}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="flex-1">
                                    <Label htmlFor="description">
                                      Description
                                    </Label>
                                    <Textarea
                                      name="description"
                                      placeholder="Description"
                                      value={sectionFormData.description}
                                      onChange={(e) =>
                                        setSectionFormData((prev) => ({
                                          ...prev,
                                          description: e.target.value,
                                        }))
                                      }
                                    />
                                  </div>
                                  <div className="flex flex-col lg:flex-row gap-4">
                                    <div className="flex-1">
                                      <Label htmlFor="fullMarks">
                                        Full Marks
                                      </Label>
                                      <Input
                                        name="fullMarks"
                                        placeholder="Full Marks"
                                        type="number"
                                        value={sectionFormData.fullMarks || ""} // Ensure value is not NaN
                                        onChange={(e) =>
                                          setSectionFormData((prev) => ({
                                            ...prev,
                                            fullMarks:
                                              e.target.value === ""
                                                ? 0
                                                : parseInt(e.target.value) || 0,
                                          }))
                                        }
                                        required
                                      />
                                    </div>
                                    <div className="flex-1">
                                      <Label htmlFor="negativeMarks">
                                        Negative Marks
                                      </Label>
                                      <Input
                                        name="negativeMarks"
                                        placeholder="Negative Marks"
                                        type="number"
                                        max={0}
                                        step="any"
                                        value={
                                          sectionFormData.negativeMarks || ""
                                        }
                                        onChange={(e) =>
                                          setSectionFormData((prev) => ({
                                            ...prev,
                                            negativeMarks:
                                              e.target.value === ""
                                                ? 0
                                                : parseFloat(e.target.value) || 0,
                                          }))
                                        }
                                      />
                                    </div>
                                    <div className="flex-1">
                                      <Label htmlFor="zeroMarks">
                                        Zero Marks
                                      </Label>
                                      <Input
                                        name="zeroMarks"
                                        placeholder="Zero Marks (default 0)"
                                        type="number"
                                        min={-100} // Set minimum value as needed
                                        max={100} // Set maximum value as needed
                                        step="any" // Allows any number including decimals
                                        value={sectionFormData.zeroMarks || ""} // Ensure value is not NaN
                                        onChange={(e) =>
                                          setSectionFormData((prev) => ({
                                            ...prev,
                                            zeroMarks:
                                              e.target.value === ""
                                                ? 0
                                                : parseFloat(e.target.value) ||
                                                  0,
                                          }))
                                        }
                                      />
                                    </div>
                                  </div>
                                  <div className="flex-1">
                                    <Label htmlFor="partialMarks">
                                        Partial Marks
                                      </Label>
                                  <Textarea
                                    name="partialMarks"
                                    placeholder="Partial Marks (comma separated) leave empty for no partial marks"
                                    value={sectionFormData.partialMarks.join(
                                      ", "
                                    )}
                                    onChange={(e) =>
                                      setSectionFormData((prev) => ({
                                        ...prev,
                                        partialMarks: e.target.value
                                          .split(",")
                                          .map(Number),
                                      }))
                                    }
                                    />
                                  </div>
                                  <div className="flex gap-2">
                                    <Button type="submit" disabled={isLoading}>
                                      {isLoading
                                        ? editingSectionId
                                          ? "Updating..."
                                          : "Adding..."
                                        : editingSectionId
                                        ? "Update Section"
                                        : "Add Section"}
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      onClick={resetSectionForm}
                                    >
                                      Cancel
                                    </Button>
                                  </div>
                                </form>
                              </CardContent>
                            </Card>
                          )}

                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead>Full Marks</TableHead>
                                <TableHead>Negative Marking</TableHead>
                                <TableHead>Partial Marks</TableHead>
                                <TableHead>Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {loadingSections && (
                                <TableRow>
                                  <TableCell colSpan={6}>
                                    Loading Sections...
                                  </TableCell>
                                </TableRow>
                              )}
                              {!loadingSections &&
                                sections[category.id]?.length === 0 && (
                                  <TableRow>
                                    <TableCell colSpan={6}>
                                      No sections found
                                    </TableCell>
                                  </TableRow>
                                )}
                              {sections[category.id]?.map((section) => (
                                <TableRow key={section.id}>
                                  <TableCell>{section.name}</TableCell>
                                  <TableCell>
                                    {/* {section.description} */}
                                    <Popover>
                                      <PopoverTrigger asChild>
                                        <p className="truncate max-w-[200px] md:max-w-[300px]">
                                          {section.description
                                            .split(" ")
                                            .slice(0, 5)
                                            .join(" ")}
                                          {section.description.split(" ")
                                            .length > 5
                                            ? "..."
                                            : ""}
                                        </p>
                                      </PopoverTrigger>
                                      <PopoverContent className="w-80">
                                        {section.description}
                                      </PopoverContent>
                                    </Popover>
                                  </TableCell>
                                  {/* <TableCell className="hidden md:block">
                                    <TooltipProvider>
                                      <Tooltip delayDuration={0}>
                                        <TooltipTrigger asChild>
                                          <p className="truncate max-w-[200px] md:max-w-[300px]">
                                            {section.description
                                              .split(" ")
                                              .slice(0, 5)
                                              .join(" ")}
                                            {section.description.split(" ")
                                              .length > 5
                                              ? "..."
                                              : ""}
                                          </p>
                                        </TooltipTrigger>
                                        <TooltipContent
                                          className="p-2 w-64 md:w-1/2 max-w-xs md:max-w-lg break-words"
                                          side="bottom"
                                          align="center"
                                          // alignOffset={50}
                                        >
                                          <p>{section.description}</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  </TableCell> */}

                                  <TableCell>{section.fullMarks}</TableCell>
                                  <TableCell>{section.negativeMarks}</TableCell>
                                  <TableCell>
                                    {section.partialMarks.join(", ")}
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex gap-2">
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        onClick={() =>
                                          handleEditSection(section)
                                        }
                                      >
                                        <Pencil className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        onClick={() =>
                                          handleDeleteSection(section.id)
                                        }
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default ExamManagement;
