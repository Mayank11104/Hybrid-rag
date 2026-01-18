from models.rag.embeddings import embed

class Retriever:
    def __init__(self, vectorstore):
        self.vectorstore = vectorstore

    def get_context(self, question):
        q_emb = embed([question])[0]
        return self.vectorstore.search(q_emb)
