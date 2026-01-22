// Question Form

import { Edit, PlusCircle, Trash2, Check, X } from "lucide-react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { useState, useEffect } from "react";
import { z } from "zod";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { MathJax, MathJaxContext } from "better-react-mathjax";
import { ChangeEvent } from "react";
import Image from "next/image";
import { uploadImgDB } from "@/app/actions/img";
import { LatexEditor } from "./PopupLatexInput";
import { set } from "date-fns";

const getQuestionType = (sectionName: string): QuestionType => {
  const name = sectionName.toUpperCase();
  if (name.includes("INTEGER") || name.includes("NUMERICAL")) return "INTEGER";
  if (name.includes("MULTI")) return "MULTI";
  return "SINGLE";
};

const mathJaxConfig = {
  tex: {
    inlineMath: [
      ["$", "$"],
      ["\(", "\)"],
    ],
    displayMath: [
      ["$$", "$$"],
      ["\[", "\]"],
    ],
    processEscapes: true,
  },
  options: {
    enableMenu: false,
  },
  startup: {
    typeset: true,
  },
};

const createQuestionSchema = (questionType: QuestionType) => {
  const baseSchema = {
    text: z.string().min(1, "Question text is required"),
    imageFile: z.any().optional(),
    chapterId: z.string().min(1, "Chapter ID is required"),
    difficultyLevel: z.enum(["EASY", "MEDIUM", "HARD"]),
  };

  const answerExplanationSchema = {
    text: z.string().optional(),
    explanation: z.string().optional(),
    imageFile: z.any().optional(),
  };

  const optionSchema = z
    .object({
      isCorrect: z.boolean(),
      text: z.string().optional(), // Changed from .min(1, "Option text is required")
      imageFile: z.any().optional(),
    })
    .refine(
      (data) => {
        // Check if text exists and is not empty, OR if imageFile exists
        const hasText = data.text && data.text.trim().length > 0;
        const hasImage = data.imageFile;
        return hasText || hasImage;
      },
      {
        message: "Option must have either text or an image",
        path: ["text"],
      },
    );

  switch (questionType) {
    case "INTEGER":
      return z
        .object({
          ...baseSchema,
          answerExplanationField: z.object({
            ...answerExplanationSchema,
            value: z.string().min(1, "Numerical answer is required"),
          }),
        })
        .refine(
          (data) => {
            const hasText = data.text && data.text.trim().length > 0;
            const hasImage = data.imageFile;
            return hasText || hasImage;
          },
          {
            message: "Question must have either text or an image",
            path: ["text"],
          },
        );

    case "MULTI":
      return z
        .object({
          ...baseSchema,
          options: z
            .array(optionSchema)
            .min(2, "At least two options are required")
            .refine((options) => options.some((opt) => opt.isCorrect), {
              message: "At least one option must be marked as correct",
            }),
          answerExplanationField: z.object(answerExplanationSchema),
        })
        .refine(
          (data) => {
            const hasText = data.text && data.text.trim().length > 0;
            const hasImage = data.imageFile;
            return hasText || hasImage;
          },
          {
            message: "Question must have either text or an image",
            path: ["text"],
          },
        );

    case "SINGLE":
    default:
      return z
        .object({
          ...baseSchema,
          options: z
            .array(optionSchema)
            .min(2, "At least two options are required")
            .refine(
              (options) => options.filter((opt) => opt.isCorrect).length === 1,
              {
                message: "Exactly one option must be marked as correct",
              },
            ),
          answerExplanationField: z.object({
            ...answerExplanationSchema,
            value: z.string().optional(),
          }),
        })
        .refine(
          (data) => {
            const hasText = data.text && data.text.trim().length > 0;
            const hasImage = data.imageFile;
            return hasText || hasImage;
          },
          {
            message: "Question must have either text or an image",
            path: ["text"],
          },
        );
  }
};

export function QuestionForm({
  name,
  examSubjectId,
  questions,
  setQuestions,
}: {
  name: string;
  examSubjectId: string;
  questions: QuestionFormState[];
  setQuestions: React.Dispatch<React.SetStateAction<QuestionFormState[]>>;
}) {
  const questionType = getQuestionType(name);
  const questionSchema = createQuestionSchema(questionType);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const getDefaultValues = (): QuestionFormState => {
    const baseValues = {
      text: "",
      imageFile: null,
      chapterId: "",
      difficultyLevel: "EASY" as const,
    };

    if (questionType === "INTEGER") {
      return {
        ...baseValues,
        answerExplanationField: {
          text: "",
          value: "",
          explanation: "",
          imageFile: null,
        },
      };
    }

    return {
      ...baseValues,
      options: [
        { isCorrect: false, text: "", imageFile: null },
        { isCorrect: false, text: "", imageFile: null },
        { isCorrect: false, text: "", imageFile: null },
        { isCorrect: false, text: "", imageFile: null },
      ],

      answerExplanationField: {
        text: "",
        explanation: "",
        ...(questionType === "SINGLE" ? { value: "" } : {}),
        imageFile: null,
      },
    };
  };
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [currentField, setCurrentField] = useState<string | null>(null);
  const [editorInitialValue, setEditorInitialValue] = useState("");
  const [isSubmit, setIsSubmit] = useState(false);

  const openLatexEditor = (fieldName: string) => {
    setCurrentField((prev) => fieldName);
    const currentValue = form.getValues(fieldName as "text");
    setEditorInitialValue((c) => currentValue);
    setIsEditorOpen(true);
  };

  const handleSaveLatex = (value: string) => {
    if (currentField) {
      form.setValue(currentField as keyof QuestionFormState, value, {
        shouldValidate: true,
      });
    }
  };
  const handleEdit = (index: number) => {
    const question = questions[index];
    form.reset(question);
    setEditingIndex(index);
  };

  const handleDelete = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleCancel = () => {
    form.reset(getDefaultValues());
    setEditingIndex(null);
  };

  const form = useForm<QuestionFormState>({
    resolver: zodResolver(questionSchema),
    defaultValues: getDefaultValues(),
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "options",
  });

  const handleSingleCorrectChange = (selectedIndex: number) => {
    fields.forEach((_, index) => {
      form.setValue(`options.${index}.isCorrect`, index === selectedIndex);
    });
  };

  const [chapters, setChapters] = useState<{ id: string; name: string }[]>([]);

  const handleImageUpload = async (
    e: ChangeEvent<HTMLInputElement>,
    fieldPath: string,
  ): Promise<void> => {
    const file = e.target.files?.[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    const imageData = { file, previewUrl };

    form.setValue(fieldPath as keyof QuestionFormState, imageData);
  };

  const handleDeleteImage = (fieldPath: string) => {
    const currentValue = form.getValues(fieldPath as keyof QuestionFormState);
    if (
      currentValue &&
      typeof currentValue === "object" &&
      "previewUrl" in currentValue &&
      currentValue.previewUrl
    ) {
      URL.revokeObjectURL(currentValue.previewUrl);
    }

    form.setValue(fieldPath as keyof QuestionFormState, null);
  };

  const onSubmit = async (formData: QuestionFormState) => {
    setIsSubmit(true);

    const timeoutId = setTimeout(() => {
      try {
        if (editingIndex !== null) {
          setQuestions((prev) =>
            prev.map((q, i) => (i === editingIndex ? formData : q)),
          );
          setEditingIndex(null);
        } else {
          setQuestions((prev) => [...prev, formData]);
        }

        form.reset(getDefaultValues());
      } catch (error) {
        console.error("Error submitting form:", error);
      } finally {
        setIsSubmit(false);
      }
    }, 1000);
  };

  useEffect(() => {
    async function fetchData() {
      if (!examSubjectId) return;
      try {
        const responseTypes = await fetch(
          `/api/v1/subjects/${examSubjectId}/chapters`,
        );
        const responseTypesJson = await responseTypes.json();
        setChapters(responseTypesJson.data);
      } catch (error) {
        console.error("Error fetching exam details:", error);
      }
    }
    fetchData();
  }, [examSubjectId]);

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case "EASY":
        return "bg-green-100 text-green-800 border-green-300";
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "HARD":
        return "bg-red-100 text-red-800 border-red-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  return (
    <MathJaxContext config={mathJaxConfig}>
      <div className="p-4 flex w-full gap-6">
        {/* Left Side - Question Form */}
        <Card className="w-1/2 mx-auto border-2 border-blue-100 shadow-lg">
          <CardHeader className="pb-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg">
            <CardTitle className="text-2xl font-bold text-blue-800 flex items-center gap-2">
              <div className="h-8 w-2 bg-blue-600 rounded-full"></div>
              Create{" "}
              {questionType.charAt(0) +
                questionType.slice(1).toLowerCase()}{" "}
              Question
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                {/* Topic and Difficulty Row */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="chapterId"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel className="font-semibold text-gray-700">
                          Topic Name
                        </FormLabel>
                        <Select
                          onValueChange={(value) => {
                            field.onChange(value);
                          }}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="border-2 border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                              <SelectValue placeholder="Select Topic" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {chapters.map((chapter) => (
                              <SelectItem key={chapter.id} value={chapter.id}>
                                {chapter.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="difficultyLevel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-semibold text-gray-700">
                          Difficulty
                        </FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex gap-2"
                          >
                            <div className="flex items-center gap-1">
                              <div
                                className={`px-3 py-2 rounded-lg border-2 ${getDifficultyColor("EASY")} ${field.value === "EASY" ? "ring-2 ring-green-500" : ""}`}
                              >
                                <RadioGroupItem
                                  value="EASY"
                                  id="easy"
                                  className="mr-2"
                                />
                                <Label
                                  htmlFor="easy"
                                  className="cursor-pointer font-medium"
                                >
                                  Easy
                                </Label>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <div
                                className={`px-3 py-2 rounded-lg border-2 ${getDifficultyColor("MEDIUM")} ${field.value === "MEDIUM" ? "ring-2 ring-yellow-500" : ""}`}
                              >
                                <RadioGroupItem
                                  value="MEDIUM"
                                  id="medium"
                                  className="mr-2"
                                />
                                <Label
                                  htmlFor="medium"
                                  className="cursor-pointer font-medium"
                                >
                                  Medium
                                </Label>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <div
                                className={`px-3 py-2 rounded-lg border-2 ${getDifficultyColor("HARD")} ${field.value === "HARD" ? "ring-2 ring-red-500" : ""}`}
                              >
                                <RadioGroupItem
                                  value="HARD"
                                  id="hard"
                                  className="mr-2"
                                />
                                <Label
                                  htmlFor="hard"
                                  className="cursor-pointer font-medium"
                                >
                                  Hard
                                </Label>
                              </div>
                            </div>
                          </RadioGroup>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                {/* Question Text Section */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-1 bg-purple-600 rounded-full"></div>
                    <Label className="font-semibold text-lg text-gray-800">
                      Question
                    </Label>
                  </div>
                  <div className="border-2 border-purple-100 rounded-xl p-4 bg-purple-50/50">
                    <FormField
                      control={form.control}
                      name="text"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Textarea
                              onClick={() => openLatexEditor("text")}
                              {...field}
                              placeholder="Enter your question text here..."
                              className="min-h-32 border-2 border-purple-200 focus:border-purple-500 focus:ring-purple-500 rounded-lg"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="imageFile"
                      render={({ field }) => (
                        <FormItem className="mt-4">
                          <FormLabel className="text-gray-600">
                            Upload Question Image (Optional)
                          </FormLabel>
                          <FormControl>
                            <div className="flex flex-col gap-2">
                              <div className="flex items-center gap-2">
                                <Input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) =>
                                    handleImageUpload(e, "imageFile")
                                  }
                                  className="w-full border-2 border-gray-300 rounded-lg"
                                />
                              </div>
                              {field.value?.previewUrl && (
                                <div className="mt-3 p-3 border-2 border-green-200 rounded-lg bg-green-50">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-green-700">
                                      Uploaded Image Preview:
                                    </span>
                                    <Button
                                      type="button"
                                      variant="destructive"
                                      size={"icon"}
                                      onClick={() => {
                                        handleDeleteImage("imageFile");
                                      }}
                                      className="h-8 w-8"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                  <Image
                                    src={field.value.previewUrl}
                                    alt="Uploaded preview"
                                    width={300}
                                    height={200}
                                    style={{
                                      width: "auto",
                                      height: "auto",
                                      maxHeight: "200px",
                                    }}
                                    className="rounded-md border-2 border-green-300 mx-auto"
                                  />
                                </div>
                              )}
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Options Section (for SINGLE and MULTI) */}
                {questionType !== "INTEGER" && (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-1 bg-blue-600 rounded-full"></div>
                        <Label className="font-semibold text-lg text-gray-800">
                          Options{" "}
                          <span className="text-sm font-normal text-blue-600">
                            {questionType === "MULTI"
                              ? "(Select multiple correct answers)"
                              : "(Select one correct answer)"}
                          </span>
                        </Label>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() =>
                          append({
                            text: "",
                            isCorrect: false,
                            imageFile: null,
                          })
                        }
                        className="h-9 px-3 border-2 border-blue-300 text-blue-700 hover:bg-blue-50"
                      >
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Add Option
                      </Button>
                    </div>

                    <div className="space-y-3">
                      {fields.map((field, index) => (
                        <Card
                          key={field.id}
                          className={`p-4 border-2 ${form.watch(`options.${index}.isCorrect`) ? "border-green-400 bg-green-50/50" : "border-gray-200"} rounded-xl transition-all duration-200 hover:shadow-md`}
                        >
                          <div className="grid grid-cols-[1fr,auto] gap-3">
                            <div className="space-y-3">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-gray-700 min-w-6">
                                  {String.fromCharCode(65 + index)}.
                                </span>
                                <FormField
                                  control={form.control}
                                  name={`options.${index}.text`}
                                  render={({ field }) => (
                                    <Input
                                      {...field}
                                      placeholder={`Option ${String.fromCharCode(65 + index)}`}
                                      onClick={() =>
                                        openLatexEditor(`options.${index}.text`)
                                      }
                                      className="border-2 border-gray-300 focus:border-blue-500"
                                    />
                                  )}
                                />
                              </div>
                              <FormField
                                control={form.control}
                                name={`options.${index}.imageFile`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-sm text-gray-600">
                                      Option Image (Optional)
                                    </FormLabel>
                                    <FormControl>
                                      <div className="flex flex-col gap-2">
                                        <Input
                                          type="file"
                                          accept="image/*"
                                          onChange={(e) =>
                                            handleImageUpload(
                                              e,
                                              `options.${index}.imageFile`,
                                            )
                                          }
                                          className="w-full border-2 border-gray-300"
                                        />
                                        {field.value?.previewUrl && (
                                          <div className="mt-2 p-3 border-2 border-blue-200 rounded-lg bg-blue-50">
                                            <div className="flex items-center justify-between mb-2">
                                              <span className="text-sm font-medium text-blue-700">
                                                Option Image:
                                              </span>
                                              <Button
                                                type="button"
                                                variant="destructive"
                                                size={"icon"}
                                                onClick={() => {
                                                  handleDeleteImage(
                                                    `options.${index}.imageFile`,
                                                  );
                                                }}
                                                className="h-8 w-8"
                                              >
                                                <Trash2 className="h-4 w-4" />
                                              </Button>
                                            </div>
                                            <Image
                                              src={field.value.previewUrl}
                                              alt="Uploaded preview"
                                              width={200}
                                              height={150}
                                              style={{
                                                width: "auto",
                                                height: "auto",
                                                maxHeight: "150px",
                                              }}
                                              className="rounded-md border-2 border-blue-300 mx-auto"
                                            />
                                          </div>
                                        )}
                                      </div>
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                            <div className="flex flex-col justify-start items-center gap-3">
                              <FormField
                                control={form.control}
                                name={`options.${index}.isCorrect`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormControl>
                                      {questionType === "MULTI" ? (
                                        <div className="flex items-center gap-2">
                                          <input
                                            type="checkbox"
                                            checked={field.value}
                                            onChange={field.onChange}
                                            className="w-5 h-5 text-green-600 border-2 border-gray-400 rounded focus:ring-green-500"
                                          />
                                          <Label className="text-sm font-medium text-gray-700">
                                            {field.value
                                              ? "Correct"
                                              : "Mark as correct"}
                                          </Label>
                                        </div>
                                      ) : (
                                        <div className="flex items-center gap-2">
                                          <input
                                            type="radio"
                                            checked={field.value}
                                            onChange={() =>
                                              handleSingleCorrectChange(index)
                                            }
                                            name="correctOption"
                                            className="w-5 h-5 text-blue-600 border-2 border-gray-400 focus:ring-blue-500"
                                          />
                                          <Label className="text-sm font-medium text-gray-700">
                                            {field.value ? "Correct" : "Select"}
                                          </Label>
                                        </div>
                                      )}
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => remove(index)}
                                disabled={fields.length <= 2}
                                className="h-9 w-9 text-red-500 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-5 w-5" />
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Answer & Explanation Section */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-1 bg-green-600 rounded-full"></div>
                    <Label className="font-semibold text-lg text-gray-800">
                      {questionType === "INTEGER"
                        ? "Answer & Solution"
                        : "Answer Explanation"}
                    </Label>
                  </div>
                  <div className="border-2 border-green-100 rounded-xl p-4 bg-green-50/50">
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      {questionType === "INTEGER" && (
                        <FormField
                          control={form.control}
                          name="answerExplanationField.value"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-700">
                                Numerical Answer
                              </FormLabel>
                              <Input
                                {...field}
                                placeholder="Enter numerical answer"
                                className="border-2 border-green-300 focus:border-green-500"
                              />
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                      <FormField
                        control={form.control}
                        name="answerExplanationField.text"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-700">
                              Answer Text
                            </FormLabel>
                            <Input
                              {...field}
                              placeholder="Enter answer text"
                              className="border-2 border-green-300 focus:border-green-500"
                            />
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      {questionType === "SINGLE" && (
                        <FormField
                          control={form.control}
                          name="answerExplanationField.value"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-700">
                                Answer Value
                              </FormLabel>
                              <Input
                                {...field}
                                placeholder="Enter answer value"
                                className="border-2 border-green-300 focus:border-green-500"
                              />
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                    </div>

                    <FormField
                      control={form.control}
                      name="answerExplanationField.explanation"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700">
                            Detailed Explanation
                          </FormLabel>
                          <Textarea
                            {...field}
                            placeholder="Enter detailed explanation here..."
                            className="min-h-32 border-2 border-green-300 focus:border-green-500 focus:ring-green-500 rounded-lg"
                            onClick={() => {
                              openLatexEditor(
                                "answerExplanationField.explanation",
                              );
                            }}
                          />
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="answerExplanationField.imageFile"
                      render={({ field }) => (
                        <FormItem className="mt-4">
                          <FormLabel className="text-gray-700">
                            Solution Image (Optional)
                          </FormLabel>
                          <FormControl>
                            <div className="flex flex-col gap-2">
                              <Input
                                type="file"
                                accept="image/*"
                                onChange={(e) =>
                                  handleImageUpload(
                                    e,
                                    "answerExplanationField.imageFile",
                                  )
                                }
                                className="w-full border-2 border-gray-300 rounded-lg"
                              />
                              {field.value?.previewUrl && (
                                <div className="mt-3 p-3 border-2 border-emerald-200 rounded-lg bg-emerald-50">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-emerald-700">
                                      Solution Image Preview:
                                    </span>
                                    <Button
                                      type="button"
                                      variant="destructive"
                                      size={"icon"}
                                      onClick={() => {
                                        handleDeleteImage(
                                          "answerExplanationField.imageFile",
                                        );
                                      }}
                                      className="h-8 w-8"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                  <Image
                                    src={field.value.previewUrl}
                                    alt="Uploaded preview"
                                    width={300}
                                    height={200}
                                    style={{
                                      width: "auto",
                                      height: "auto",
                                      maxHeight: "200px",
                                    }}
                                    className="rounded-md border-2 border-emerald-300 mx-auto"
                                  />
                                </div>
                              )}
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Submit Buttons */}
                <div className="flex gap-3 mt-6 pt-4 border-t-2 border-gray-200">
                  <Button
                    type="submit"
                    className={`flex-1 h-12 text-lg font-semibold ${editingIndex !== null ? "bg-amber-600 hover:bg-amber-700" : "bg-blue-600 hover:bg-blue-700"}`}
                    disabled={isSubmit}
                  >
                    {editingIndex !== null
                      ? "Update Question"
                      : isSubmit
                        ? "Adding Question..."
                        : "Add Question"}
                  </Button>
                  {editingIndex !== null && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCancel}
                      className="h-12 px-6 border-2 border-red-300 text-red-600 hover:bg-red-50"
                    >
                      <X className="h-5 w-5 mr-2" />
                      Cancel Edit
                    </Button>
                  )}
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Right Side - Question List */}
        <Card className="w-1/2 mx-auto border-2 border-orange-100 shadow-lg">
          <CardHeader className="pb-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-t-lg">
            <CardTitle className="text-2xl font-bold text-orange-800 flex items-center gap-2">
              <div className="h-8 w-2 bg-orange-600 rounded-full"></div>
              Questions in {questionType} Choice Type
              <span className="ml-auto text-lg font-normal bg-orange-100 text-orange-800 px-3 py-1 rounded-full">
                {questions.length}{" "}
                {questions.length === 1 ? "question" : "questions"}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 max-h-[calc(225vh-200px)] overflow-y-scroll p-2">
            {questions.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-xl">
                <div className="text-gray-400 mb-2">
                  <svg
                    className="w-16 h-16 mx-auto"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <p className="text-gray-500 text-lg">No questions added yet</p>
                <p className="text-gray-400 text-sm mt-1">
                  Questions will appear here once added
                </p>
              </div>
            ) : (
              questions.map((question, index) => (
                <Card
                  key={index}
                  className="p-5 border-2 border-gray-200 hover:border-blue-300 transition-all duration-200 rounded-xl shadow-sm hover:shadow-md"
                >
                  <div className="space-y-4">
                    {/* Question Header with Actions */}
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div
                            className={`px-3 py-1 rounded-full text-sm font-semibold ${getDifficultyColor(question.difficultyLevel)}`}
                          >
                            {question.difficultyLevel}
                          </div>
                          <span className="text-lg font-bold text-blue-700">
                            Q.{index + 1}
                          </span>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg border-2 border-gray-100">
                          <h3 className="text-lg font-semibold text-gray-800 mb-2">
                            <MathJax inline dynamic>
                              {question.text || "Question text..."}
                            </MathJax>
                          </h3>
                          {question.imageFile?.previewUrl && (
                            <div className="mt-3 p-3 border-2 border-blue-200 rounded-lg bg-blue-50 inline-block">
                              <Image
                                src={question.imageFile?.previewUrl}
                                alt="Question Image"
                                width={300}
                                height={200}
                                style={{
                                  width: "auto",
                                  height: "auto",
                                  maxHeight: "200px",
                                }}
                                className="rounded-md border-2 border-blue-300"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => handleEdit(index)}
                          className="h-10 w-10 border-2 border-blue-300 text-blue-600 hover:bg-blue-50"
                          title="Edit Question"
                        >
                          <Edit className="h-5 w-5" />
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => handleDelete(index)}
                          className="h-10 w-10 border-2 border-red-300 text-red-600 hover:bg-red-50"
                          title="Delete Question"
                        >
                          <Trash2 className="h-5 w-5" />
                        </Button>
                      </div>
                    </div>

                    {/* Options Display */}
                    {question.options && (
                      <div className="space-y-2">
                        <Label className="font-semibold text-gray-700">
                          Options:
                        </Label>
                        <div className="grid grid-cols-2 gap-3">
                          {question.options.map((option, optIndex) => (
                            <div
                              key={optIndex}
                              className={`p-3 rounded-lg border-2 ${option.isCorrect ? "border-green-400 bg-green-50" : "border-gray-200 bg-gray-50"} transition-all duration-200`}
                            >
                              <div className="flex items-center gap-3">
                                <div
                                  className={`w-6 h-6 rounded-full flex items-center justify-center ${option.isCorrect ? "bg-green-100 text-green-700 border-2 border-green-400" : "bg-gray-100 text-gray-600 border-2 border-gray-300"}`}
                                >
                                  {String.fromCharCode(65 + optIndex)}
                                </div>
                                <div className="flex-1">
                                  <p className="text-gray-800 font-medium">
                                    <MathJax inline dynamic>
                                      {option.text || "Option text..."}
                                    </MathJax>
                                  </p>
                                </div>
                                {option.isCorrect && (
                                  <Check className="h-5 w-5 text-green-600" />
                                )}
                              </div>
                              {option.imageFile?.previewUrl && (
                                <div className="mt-2 ml-9">
                                  <Image
                                    src={option.imageFile?.previewUrl}
                                    alt="Option Image"
                                    width={150}
                                    height={100}
                                    style={{
                                      width: "auto",
                                      height: "auto",
                                      maxHeight: "100px",
                                    }}
                                    className="rounded-md border border-gray-300"
                                  />
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Answer Explanation Display */}
                    <div className="border-t-2 border-gray-100 pt-4">
                      <Label className="font-semibold text-gray-700 mb-2 block">
                        Answer & Explanation:
                      </Label>
                      <div className="bg-emerald-50 p-4 rounded-lg border-2 border-emerald-100">
                        {question.answerExplanationField.text && (
                          <div className="mb-3">
                            <span className="font-medium text-emerald-800">
                              Text Answer:
                            </span>
                            <p className="text-gray-800 mt-1">
                              <MathJax inline dynamic>
                                {question.answerExplanationField.text}
                              </MathJax>
                            </p>
                          </div>
                        )}
                        {question.answerExplanationField.value && (
                          <div className="mb-3">
                            <span className="font-medium text-emerald-800">
                              {questionType === "INTEGER"
                                ? "Numerical Answer:"
                                : "Value:"}
                            </span>
                            <p className="text-gray-800 font-semibold mt-1">
                              <MathJax inline dynamic>
                                {question.answerExplanationField.value}
                              </MathJax>
                            </p>
                          </div>
                        )}
                        {question.answerExplanationField.explanation && (
                          <div className="mb-3">
                            <span className="font-medium text-emerald-800">
                              Explanation:
                            </span>
                            <p className="text-gray-800 mt-1">
                              <MathJax inline dynamic>
                                {question.answerExplanationField.explanation}
                              </MathJax>
                            </p>
                          </div>
                        )}
                        {question.answerExplanationField.imageFile
                          ?.previewUrl && (
                          <div className="mt-3">
                            <span className="font-medium text-emerald-800 mb-2 block">
                              Solution Image:
                            </span>
                            <Image
                              src={
                                question.answerExplanationField.imageFile
                                  ?.previewUrl
                              }
                              alt="Solution Image"
                              width={250}
                              height={150}
                              style={{
                                width: "auto",
                                height: "auto",
                                maxHeight: "150px",
                              }}
                              className="rounded-md border-2 border-emerald-300"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </CardContent>
        </Card>
        <LatexEditor
          isOpen={isEditorOpen}
          onClose={() => setIsEditorOpen(false)}
          initialValue={editorInitialValue}
          onSave={handleSaveLatex}
        />
      </div>
    </MathJaxContext>
  );
}
