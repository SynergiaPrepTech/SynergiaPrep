import { useEffect, useState } from "react";
// import { QuestionForm } from "./QuestionForm";
import { QuestionForm } from "./QuestionForm";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Trash2, Edit2, Plus, ChevronDown } from "lucide-react";
// import { FormItem, FormLabel } from "./ui/form"; // Adjust path as needed
import { Input } from "@/components/ui/input";
// Import DropdownMenu components
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"; // Adjust path as needed
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
// import { Label } from "./ui/label";

export function SectionDetailsForm({
  examSections,
  setCurrentStep,
  setExamSections,
  examConfigId,
}: {
  examSections: SectionFormState[];
  setCurrentStep: React.Dispatch<React.SetStateAction<string>>;
  setExamSections: React.Dispatch<React.SetStateAction<SectionFormState[]>>;
  examConfigId: string;
}) {
  const [saved, setSaved] = useState(true);
  const [activeSection, setActiveSection] = useState<{
    id: string;
    name: string;
    description: string;
    fullMarks: number;
    negativeMarks: number;
    zeroMarks: number;
    partialMarks: number[];
    examCategoryId: string;
  } | null>(null);
  const [availableSections, setAvailableSections] = useState<
    {
      id: string;
      name: string;
      description: string;
      fullMarks: number;
      negativeMarks: number;
      zeroMarks: number;
      partialMarks: number[];
      examCategoryId: string;
    }[]
  >([]);
  const [questions, setQuestions] = useState<QuestionFormState[]>([]);
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [mode, setMode] = useState<"add" | "edit">("add");
  const [subjects, setSubjects] = useState<{ id: string; name: string }[]>([]);
  const [examSubjectId, setExamSubjectId] = useState("");

  useEffect(() => {
    async function fetchData() {
      try {
        const responseTypes = await fetch(
          `/api/v1/exam-categories/${examConfigId}`
        );
        const responseTypesJson = await responseTypes.json();
        setSubjects(
          responseTypesJson.data.subjects
            ? responseTypesJson.data.subjects
            : [{ id: "NA", name: "NA" }]
        );
      } catch (error) {
        console.error("Error fetching exam details:", error);
      }
    }
    fetchData();
  }, [examConfigId]);

  useEffect(() => {
    async function fetchData() {
      if (!examConfigId) return;
      try {
        const response = await fetch(
          `/api/v1/exam-categories/${examConfigId}/section-configs`
        );
        const responseTypes = await response.json();

        if (!responseTypes) return;

        const availableSecs = responseTypes.data;

        setAvailableSections(
          availableSecs
            ? availableSecs
            : [
              {
                id: "NA",
                name: "NA",
                description: "NA",
                fullMarks: 0,
                negativeMarks: 0,
                zeroMarks: 0,
                partialMarks: [],
                examCategoryId: "NA",
              },
            ]
        );
        // setExamCategories(
        //   categoriesData.data
        //     ? categoriesData.data
        //     : [{ examPattern: "NA", description: "NA", id: "NA", name: "NA" }]
        // );
      } catch (error) {
        console.error("Error fetching exam details:", error);
      }
    }

    fetchData();
  }, [examConfigId, examSections]);

  // Add this useEffect in SectionDetailsForm
useEffect(() => {
  // When a section is selected for editing, ensure its subjectId is used
  if (mode === "edit" && editingSectionId) {
    const sectionToEdit = examSections.find(s => s.sectionConfigId === editingSectionId);
    if (sectionToEdit?.subjectId && sectionToEdit.subjectId !== examSubjectId) {
      setExamSubjectId(sectionToEdit.subjectId);
    }
  }
}, [mode, editingSectionId, examSections]);

  function handleDeleteSection(sectionId: string) {
    if (editingSectionId === sectionId) {
      setEditingSectionId(null);
      setMode("add");
      setQuestions([]);
    }
    setExamSections((prev) =>
      prev.filter((section) => section.sectionConfigId !== sectionId)
    );
    // setAvailableSections((prev) =>
    //   [...prev, availableSections.find((s) => s.id === sectionId)!].filter(
    //     Boolean
    //   )
    // );
    setSaved(true);
  }

  // In SectionDetailsForm component
function handleEditSection(section: SectionFormState) {
  setEditingSectionId(section.sectionConfigId);
  setMode("edit");
  setQuestions(section.questions);
  setExamSubjectId(section.subjectId || ""); // Initialize with existing subjectId
  setSaved(false);
}

 function handleSaveEdit() {
  if (!editingSectionId) return;
  
  // Ensure we have a subjectId for editing
  const currentSubjectId = examSubjectId || 
    examSections.find(s => s.sectionConfigId === editingSectionId)?.subjectId || "";
  
  if (!currentSubjectId) {
    toast.error("Please select a subject before saving");
    return;
  }

  setExamSections((prev) =>
    prev.map((section) =>
      section.sectionConfigId === editingSectionId
        ? {
          ...section,
          subjectId: currentSubjectId, // Update subjectId
          subject: subjects.find((s) => s.id === currentSubjectId)?.name || section.subject,
          questions: questions.map(q => ({
            ...q,
            chapterId: q.chapterId || ""
          })),
          numberOfQuestionsToAttempt: questions.length,
        }
        : section
    )
  );
  
  setEditingSectionId(null);
  setMode("add");
  setQuestions([]);
  setExamSubjectId(""); // Reset subject selection
  setSaved(true);
}

  function handleCancelEdit() {
    setEditingSectionId(null);
    setMode("add");
    setQuestions([]);
    setSaved(true);
  }

 function handleAddSection() {
  if (!activeSection) return;
  
  // Ensure we have a subjectId
  if (!examSubjectId) {
    toast.error("Please select a subject before adding the section");
    return;
  }

  setSaved(true);
  setExamSections((prev) => [
    ...prev,
    {
      name: activeSection.name,
      description: activeSection.description,
      isAllQuestionsMandatory: true,
      numberOfQuestionsToAttempt: questions.length,
      sectionConfigId: activeSection.id,
      sectionConfig: activeSection.name,
      subjectId: examSubjectId, // Make sure this is included
      subject: subjects.find((s) => s.id === examSubjectId)?.name || "",
      questions: questions.map(q => ({
        ...q,
        // Ensure chapterId is included in each question
        chapterId: q.chapterId || ""
      })),
    },
  ]);
  
  setActiveSection(null);
  setQuestions([]);
  setExamSubjectId(""); // Reset subject selection
}

  function handleCancelAddSection() {
    setActiveSection(null);
    setQuestions([]);
    setSaved(true);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Added Sections</h3>
        <div className="flex items-center space-x-4">
          {activeSection && mode === "add" && (
            <>
              <Button
                type="button"
                variant="default"
                onClick={handleAddSection}
              // disabled={mode === "edit"}
              >
                Add Section ..
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleCancelAddSection}
              // disabled={mode === "edit"}
              >
                Cancel
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Added Sections List */}
      <div className="flex flex-wrap items-center gap-4">
        {examSections.map((section, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-4 border rounded-lg"
          >
            <div>
              <h4 className="font-medium pr-2">{section.name}</h4>
              <p className="text-sm text-gray-500">
                {section.questions.length} questions
              </p>
            </div>
            <div className="flex space-x-2">
              <Button
                variant="edit"
                size="icon"
                onClick={() => handleEditSection(section)}
                disabled={
                  editingSectionId !== null &&
                  editingSectionId !== section.sectionConfigId
                }
              >
                <Edit2 className="h-4 w-4" />
              </Button>
              <Button
                variant="destructive"
                size="icon"
                onClick={() => handleDeleteSection(section.sectionConfigId)}
                disabled={editingSectionId === section.sectionConfigId}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
        <DropdownMenu>
          <DropdownMenuTrigger
            className="flex items-center justify-between rounded-md border border-input bg-background px-3 py-2 p-4 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 w-48 h-full"
            disabled={
              !saved || mode === "edit" || availableSections.length === 0
            }
            asChild
          >
            <Button
              variant="outline"
              size="icon" // Added size="sm"
              className="justify-start text-left font-large"
            >
              {activeSection ? (
                activeSection.name
              ) : availableSections.length === 0 ? (
                "All sections added"
              ) : (
                <div className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add Section
                </div>
              )}
              <ChevronDown className="ml-auto h-4 w-4 opacity-50 shrink-0" />{" "}
              {/* Added Chevron */}
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent>
            <DropdownMenuLabel>Select Section</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {availableSections.map((section) => (
              <DropdownMenuItem
                key={section.id}
                onSelect={() => {
                  setActiveSection(section);
                  setQuestions([]);
                  setSaved(false);
                }}
              >
                {section.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Edit Section */}
      {mode === "edit" && editingSectionId && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">
              Edit Section:{" "}
              {
                examSections.find((s) => s.sectionConfigId === editingSectionId)
                  ?.name
              }
            </h3>
            <div className="flex space-x-2">
              <Button variant="destructive" onClick={handleCancelEdit}>
                Cancel
              </Button>
              <Button variant="default" onClick={handleSaveEdit}>
                Save Changes
              </Button>
            </div>
          </div>
          <div className="bg-background">
            <Select onValueChange={setExamSubjectId} value={examSubjectId}>
              <SelectTrigger>
                <SelectValue placeholder="Select Subject" />
              </SelectTrigger>
              <SelectContent>
                {subjects.map((subject) => (
                  <SelectItem key={subject.id} value={subject.id}>
                    {subject.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <QuestionForm
            name={
              examSections.find((s) => s.sectionConfigId === editingSectionId)
                ?.name || ""
            }
            examSubjectId={examSubjectId}
            questions={questions}
            setQuestions={setQuestions}
          />
        </div>
      )}

      {/* Add New Section Form */}
      {mode === "add" && activeSection && (
        <div className="space-y-4 bg-white shadow-lg p-4 rounded-lg">
              <Input
                placeholder="Section Name"
                value={activeSection?.name ?? ""}
                onChange={(e) =>
                  setActiveSection((prev) =>
                    prev ? { ...prev, name: e.target.value } : prev
                  )
                }
              />
          <Select onValueChange={setExamSubjectId} value={examSubjectId}>
            <SelectTrigger>
              <SelectValue placeholder="Select Subject" />
            </SelectTrigger>
            <SelectContent>
              {subjects.map((subject) => (
                <SelectItem key={subject.id} value={subject.id}>
                  {subject.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <QuestionForm
            name={activeSection.name}
            examSubjectId={examSubjectId}
            questions={questions}
            setQuestions={setQuestions}
          />
        </div>
      )}

      {/* No Section Selected State */}
      {mode === "add" && !activeSection && !editingSectionId && (
        <Alert>
          <AlertDescription>
            {availableSections.length === 0
              ? "No more sections available to add."
              : "Select a section to add from the dropdown above."}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

export default SectionDetailsForm;
