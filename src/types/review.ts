export interface Review {
  id: number
  authorName: string
  rating: number
  title: string
  text: string
  verifiedPurchase: boolean
  createdAt: string
}

export interface CreateReviewRequest {
  authorEmail: string
  authorName: string
  rating: number
  title?: string
  text: string
}
