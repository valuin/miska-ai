"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const WorkflowDetails = ({
  name,
  description,
  setName,
  setDescription,
}: {
  name: string;
  description: string;
  setName: (name: string) => void;
  setDescription: (description: string) => void;
}) => (
  <Card>
    <CardHeader>
      <CardTitle>Workflow Details</CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      <div>
        <Label htmlFor="workflow-name">Workflow Name</Label>
        <Input
          id="workflow-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter workflow name"
          className="mt-1"
        />
      </div>
      <div>
        <Label htmlFor="workflow-description">Description</Label>
        <Textarea
          id="workflow-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Enter workflow description"
          className="mt-1"
        />
      </div>
    </CardContent>
  </Card>
);

export const NodeBuilder = () => (
  <Card>
    <CardHeader>
      <CardTitle>Build Workflow</CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-sm text-muted-foreground">
        Use the canvas to add and connect nodes.
      </p>
    </CardContent>
  </Card>
);

export const WorkflowReview = () => (
  <Card>
    <CardHeader>
      <CardTitle>Review & Test</CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-sm text-muted-foreground">
        Review your workflow configuration and run it.
      </p>
    </CardContent>
  </Card>
);

export const steps = [
  { id: 1, title: "Details", description: "Configure basic settings" },
  { id: 2, title: "Build", description: "Add and connect nodes" },
  { id: 3, title: "Review", description: "Review and test" },
];