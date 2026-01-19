"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import MultipleSelector, { Option } from "@/components/ui/multiple-selector";
import {
  Search,
  MoreHorizontal,
  Plus,
  BookOpen,
  Calendar,
  Trash2,
  Edit,
  Eye,
  FileText,
  Video,
  Star,
} from "lucide-react";
import Image from "next/image";
import { se } from "date-fns/locale";
import { uploadFileToS3 } from "./action";

interface Course {
  id: string;
  title: string;
  subtitle: string;
  thumbnailUrl: string;
  description: string;
  price: number;
  discount: number;
  level: "BASIC" | "STANDARD" | "PREMIUM";
  examCategories: { id: string; name: string }[];
  examIds: { id: string; title: string }[];
}

interface ExamCategory {
  id: string;
  name: string;
  description: string;
  eligibility: string;
  cutoffs: string;
  examPattern: string;
  subjects: { id: string; name: string }[];
}

interface NewCourse {
  title: string;
  subtitle: string;
  thumbnailUrl: string;
  description: string;
  price: number;
  discount: number;
  level: "BASIC" | "STANDARD" | "PREMIUM" | "COMING_SOON";
  examCategoryIds: string[];
  examIds: string[];
}

interface EditCourse extends NewCourse {
  id: string;
}

export default function CourseManagement() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [courseImage, setCourseImage] = useState<{
    file: File;
    previewUrl: string;
  }>();
  const [newCourse, setNewCourse] = useState<NewCourse>({
    title: "",
    subtitle: "",
    thumbnailUrl: "",
    description: "",
    price: 0,
    discount: 0,
    level: "BASIC",
    examCategoryIds: [] as string[],
    examIds: [] as string[],
  });
  const [EditCourse, setEditCourse] = useState<EditCourse | null>(null);
  const [categories, setCategories] = useState<ExamCategory[]>([]);
  const [options, setOptions] = useState([] as Option[]);

  useEffect(() => {
    fetchCourses();
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      // setloadingCategories(true);
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
      setOptions(
        data.data.map((category: { id: string; name: string }) => ({
          label: category.name,
          value: category.id,
        }))
      );
      // console.log("Categories: ", categories);
    } catch (err) {
      // setError("Failed to fetch categories");
    } finally {
      // setloadingCategories(false);
    }
  };

  const fetchCourses = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/v1/courses");
      if (!response.ok) {
        throw new Error("Failed to fetch courses");
      }
      const data = await response.json();
      // console.log("Received data:", data.data); // Check if data is as expected
      setCourses(data.data);
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching courses:", error);
      setIsLoading(false);
    }
  };

  // Filter courses based on search query and filters
  const filteredCourses = (courses || []).filter((course) => {
    const title = course?.title || ""; // Ensure course.title is not undefined
    const matchesSearch = title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());

    // const matchesCategory =
    //   categoryFilter === "all" || course?.examCategories.includes(categoryFilter);
    // const matchesStatus =
    //   statusFilter === "all" || course?.status === statusFilter;

    return matchesSearch;
  });

  const uploadImage = async (file: File) => {
    const imageUrl = await uploadFileToS3(file);
    return imageUrl;
  };

  const handleCreateCourse = async () => {
    // Validate form
    if (!newCourse.title) {
      alert("Please fill in all required fields");
      return;
    }

    if (!courseImage) {
      alert("Please upload a course image.");
      return;
    }

    // console.log("Creating course:", newCourse);

    // Upload the course image and get its URL
    const ImageURL = await uploadImage(courseImage.file);
    // console.log("ImageURL: ", ImageURL);

    // Create a new course object with the updated thumbnailUrl
    const updatedCourse = { ...newCourse, thumbnailUrl: ImageURL ?? "" };

    // Update state if needed (this will happen asynchronously)
    setNewCourse(updatedCourse);

    // console.log("POST: ", updatedCourse);

    // Send a POST request with the updated course data
    const response = await fetch("/api/v1/courses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedCourse),
    });
    const data = await response.json();
    URL.revokeObjectURL(courseImage.previewUrl);
    // console.log(data);

    // Refresh courses list, close the dialog, and reset form data
    fetchCourses();
    setIsCreateDialogOpen(false);
    setNewCourse({
      title: "",
      subtitle: "",
      description: "",
      price: 0,
      discount: 0,
      level: "BASIC",
      thumbnailUrl: "",
      examCategoryIds: [],
      examIds: [],
    });
  };

  const handleDeleteCourse = async (courseId: string) => {
    // In a real app, you would call your API to delete the course
    const response = await fetch(`/api/v1/courses/${courseId}`, {
      method: "DELETE",
    });
    const data = await response.json();
    // console.log(data);

    fetchCourses();
    setIsDeleteDialogOpen(false);
  };

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ): Promise<void> => {
    const file = e.target.files?.[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    const imageData = { file, previewUrl };
    // console.log(imageData);
    setCourseImage(imageData);
  };

  const handleEditClick = (course: Course) => {
    setEditCourse({
      id: course.id,
      title: course.title,
      subtitle: course.subtitle,
      thumbnailUrl: course.thumbnailUrl,
      description: course.description,
      price: course.price,
      discount: course.discount,
      level: course.level,
      examCategoryIds: course.examCategories?.map((cat) => cat.id) || [],
      examIds: course.examIds?.map((cat) => cat.id) || [],
    });
    // console.log("Edit course: ", course);
  };

  const handleEditCourse = async () => {
    const { id, ...updatedCourse } = EditCourse as EditCourse;
    console.log("Updated course: ", updatedCourse);

    // Send a PUT request with the updated course data
    const response = await fetch(`/api/v1/courses/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedCourse),
    });
    const data = await response.json();
    console.log(data);

    // Refresh courses list, close the dialog, and reset form data
    fetchCourses();
    setIsEditDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Course Management
          </h2>
          <p className="text-muted-foreground">
            Create, edit, and manage courses on your platform.
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Course
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search courses..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.name}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Courses Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                {/* <TableHead>Instructor</TableHead> */}
                <TableHead>Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Level</TableHead>
                {/* <TableHead>Status</TableHead> */}
                {/* <TableHead>Enrollments</TableHead> */}
                {/* <TableHead>Rating</TableHead> */}
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    Loading courses...
                  </TableCell>
                </TableRow>
              ) : filteredCourses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    No courses found. Try adjusting your filters.
                  </TableCell>
                </TableRow>
              ) : (
                filteredCourses.map((course, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">
                      {course.title}
                    </TableCell>
                    {/* <TableCell>{course.instructor}</TableCell> */}
                    <TableCell>
                      {course.examCategories
                        .map((cat, idx) => cat.name)
                        .join(", ")}
                    </TableCell>

                    <TableCell>
                      <div className="flex flex-col">
                        <span className="line-through text-muted-foreground">
                          ₹{course.price}
                        </span>
                        <span className="font-medium">
                          ₹{(course.price - course.discount).toFixed(2)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{course.level}</TableCell>

                    {/* <TableCell>{getStatusBadge(course.status)}</TableCell> */}
                    {/* <TableCell>{course.enrollments}</TableCell> */}
                    {/* <TableCell>
                      <div className="flex items-center">
                        <Star className="h-4 w-4 text-yellow-500 mr-1" />
                        <span>{course.rating}</span>
                      </div>
                    </TableCell> */}
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedCourse(course);
                              setIsViewDialogOpen(true);
                            }}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              handleEditClick(course);
                              setIsEditDialogOpen(true);
                            }}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Course
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => {
                              setSelectedCourse(course);
                              setIsDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Course
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create Course Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add New Course</DialogTitle>
            <DialogDescription>
              Create a new course on your platform. You can add content and
              media after creating the course.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">
                Title
              </Label>
              <Input
                id="title"
                value={newCourse.title}
                onChange={(e) =>
                  setNewCourse({ ...newCourse, title: e.target.value })
                }
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="subtitle" className="text-right">
                Subtitle
              </Label>
              <Input
                id="subtitle"
                value={newCourse.subtitle}
                onChange={(e) =>
                  setNewCourse({ ...newCourse, subtitle: e.target.value })
                }
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Textarea
                id="description"
                value={newCourse.description}
                onChange={(e) =>
                  setNewCourse({ ...newCourse, description: e.target.value })
                }
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category" className="text-right">
                Category
              </Label>
              <div className="col-span-3">
                <MultipleSelector
                  options={options}
                  placeholder="Select categories"
                  emptyIndicator={"All categories selected."}
                  onChange={(selected) => {
                    // console.log("Selected: ", selected);
                    // setSelectedOptions(selected);
                    setNewCourse({
                      ...newCourse,
                      examCategoryIds: selected.map((option) => option.value),
                    });
                    // console.log("New Course: ", newCourse);
                  }}
                />
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="price" className="text-right">
                Price (₹)
              </Label>
              <Input
                id="price"
                type="number"
                value={newCourse.price == 0 ? "" : newCourse.price}
                onChange={(e) => {
                  const value =
                    e.target.value.trim() === "" ? 0 : Number(e.target.value);
                  setNewCourse({ ...newCourse, price: value });
                }}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="discountPrice" className="text-right">
                Discount Price (₹)
              </Label>
              <Input
                id="discountPrice"
                type="number"
                value={newCourse.discount == 0 ? "" : newCourse.discount}
                onChange={(e) => {
                  const value =
                    e.target.value.trim() === "" ? 0 : Number(e.target.value);
                  setNewCourse({ ...newCourse, discount: value });
                }}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="level" className="text-right">
                Level
              </Label>
              <Select
                value={newCourse.level}
                onValueChange={(value) =>
                  setNewCourse({
                    ...newCourse,
                    level: value as "BASIC" | "STANDARD" | "PREMIUM",
                  })
                }
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BASIC">BASIC</SelectItem>
                  <SelectItem value="STANDARD">STANDARD</SelectItem>
                  <SelectItem value="PREMIUM">PREMIUM</SelectItem>
                  <SelectItem value="COMING_SOON">Coming Soon</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="thumbnail" className="text-right">
                Thumbnail URL
              </Label>
              <Input
                id="thumbnail"
                type="file"
                accept="image/*"
                onChange={(e) => handleImageUpload(e)}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateCourse}>Create Course</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Course Dialog */}
      {EditCourse && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Edit Course</DialogTitle>
              <DialogDescription>
                Update the course details and settings.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="title" className="text-right">
                  Title
                </Label>
                <Input
                  id="title"
                  value={EditCourse.title}
                  onChange={(e) =>
                    setEditCourse({
                      ...EditCourse,
                      title: e.target.value,
                    })
                  }
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="subtitle" className="text-right">
                  Subtitle
                </Label>
                <Input
                  id="subtitle"
                  value={EditCourse.subtitle}
                  onChange={(e) =>
                    setEditCourse({
                      ...EditCourse,
                      subtitle: e.target.value,
                    })
                  }
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                  Description
                </Label>
                <Textarea
                  id="description"
                  value={EditCourse.description}
                  onChange={(e) =>
                    setEditCourse({
                      ...EditCourse,
                      description: e.target.value,
                    })
                  }
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="category" className="text-right">
                  Category
                </Label>
                <div className="col-span-3">
                  <MultipleSelector
                    options={options}
                    value={EditCourse.examCategoryIds.map((cat) => ({
                      label: categories.find((category) => category.id === cat)?.name || "",
                      value: cat,
                    }))}
                    placeholder="Select categories"
                    emptyIndicator={"All categories selected."}
                    onChange={(selected) => {
                      // console.log("Selected: ", selected);
                      // setSelectedOptions(selected);
                      setEditCourse({
                        ...EditCourse,
                        examCategoryIds: selected.map((option) => option.value),
                      });
                      // console.log("New Course: ", newCourse);
                    }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="price" className="text-right">
                  Price (₹)
                </Label>
                <Input
                  id="price"
                  type="number"
                  value={EditCourse.price ?? ""}
                  onChange={(e) => {
                    const value =
                      e.target.value.trim() === "" ? 0 : Number(e.target.value);
                    setEditCourse({
                      ...EditCourse,
                      price: value,
                    });
                  }}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="discountPrice" className="text-right">
                  Discount Price (₹)
                </Label>
                <Input
                  id="discountPrice"
                  type="number"
                  value={EditCourse.discount ?? ""}
                  onChange={(e) => {
                    const value =
                      e.target.value.trim() === "" ? 0 : Number(e.target.value);
                    setEditCourse({
                      ...EditCourse,
                      discount: value,
                    });
                  }}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="level" className="text-right">
                  Level
                </Label>
                <Select
                  value={EditCourse.level}
                  onValueChange={(value) =>
                    setEditCourse({
                      ...EditCourse,
                      level: value as "BASIC" | "STANDARD" | "PREMIUM",
                    })
                  }
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BASIC">BASIC</SelectItem>
                    <SelectItem value="STANDARD">STANDARD</SelectItem>
                    <SelectItem value="PREMIUM">PREMIUM</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  handleEditCourse();
                  setIsEditDialogOpen(false);
                  setEditCourse(null);
                  // fetchCourses();
                }}
              >
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* View Course Dialog */}
      {selectedCourse && (
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="sm:max-w-[700px]">
            <DialogHeader>
              <DialogTitle>Course Details</DialogTitle>
            </DialogHeader>
            <Tabs defaultValue="overview">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                {/* <TabsTrigger value="content">Content</TabsTrigger>
                <TabsTrigger value="stats">Stats</TabsTrigger> */}
              </TabsList>
              <TabsContent value="overview" className="space-y-4">
                <div className="aspect-video relative overflow-hidden rounded-lg">
                  <Image
                    src={
                      selectedCourse.thumbnailUrl ||
                      "/placeholder.svg?height=200&width=400"
                    }
                    alt={selectedCourse.title}
                    className="object-cover w-full h-full"
                    width={400}
                    height={200}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-lg font-semibold">
                      {selectedCourse.title}
                    </h3>
                    <p className="text-muted-foreground">
                      {selectedCourse.description}
                    </p>
                  </div>

                  <div className="space-y-2">
                    {/* <div className="flex justify-between">
                      <span className="text-muted-foreground">Instructor:</span>
                      <span>{selectedCourse.instructor}</span>
                    </div> */}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Category:</span>
                      <span>
                        {selectedCourse.examCategories.map((cat, idx) => {
                          return <span key={idx}>{cat.name}</span>;
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Level:</span>
                      <span>{selectedCourse.level}</span>
                    </div>
                    {/* <div className="flex justify-between">
                      <span className="text-muted-foreground">Duration:</span>
                      <span>{selectedCourse.duration}</span>
                    </div> */}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Price:</span>
                      <div>
                        <span className="line-through text-muted-foreground">
                          ₹{selectedCourse.price}
                        </span>{" "}
                        <span className="font-medium">
                          ₹{selectedCourse.discount}
                        </span>
                      </div>
                    </div>
                    {/* <div className="flex justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      <span>{getStatusBadge(selectedCourse.status)}</span>
                    </div> */}
                  </div>
                </div>
              </TabsContent>

              {/* <TabsContent value="content">
                <div className="space-y-4">
                  {selectedCourse.sections && selectedCourse.sections.length > 0 ? (
                    selectedCourse.sections.map((section, index) => (
                      <Card key={index}>
                        <CardHeader className="py-3">
                          <CardTitle className="text-base">{section.title}</CardTitle>
                        </CardHeader>
                        <CardContent className="py-0">
                          <ul className="space-y-2">
                            {section.lessons.map((lesson, lessonIndex) => (
                              <li
                                key={lessonIndex}
                                className="flex justify-between items-center py-2 border-b last:border-0"
                              >
                                <div className="flex items-center">
                                  {lesson.type === "video" ? (
                                    <Video className="h-4 w-4 mr-2 text-blue-500" />
                                  ) : (
                                    <FileText className="h-4 w-4 mr-2 text-green-500" />
                                  )}
                                  <span>{lesson.title}</span>
                                </div>
                                <span className="text-muted-foreground text-sm">{lesson.duration}</span>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No content sections available for this course.
                    </div>
                  )}
                </div>
              </TabsContent> */}

              {/* <TabsContent value="stats">
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Enrollments</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{selectedCourse.enrollments}</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Rating</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center">
                        <Star className="h-5 w-5 text-yellow-500 mr-1" />
                        <span className="text-2xl font-bold">{selectedCourse.rating}</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Created</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>{selectedCourse.createdAt}</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Last Updated</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>{selectedCourse.updatedAt}</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent> */}
            </Tabs>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsViewDialogOpen(false)}
              >
                Close
              </Button>
              <Button
                onClick={() => {
                  setIsViewDialogOpen(false);
                  setIsEditDialogOpen(true);
                }}
              >
                Edit Course
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Course Dialog */}
      {selectedCourse && (
        <AlertDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete the course &quot;
                {selectedCourse.title}&quot;. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-red-600 hover:bg-red-700"
                onClick={() => handleDeleteCourse(selectedCourse.id)}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
